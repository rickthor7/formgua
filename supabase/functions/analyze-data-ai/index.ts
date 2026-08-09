// Edge function: AI-powered statistical data analysis on collected form responses.
// Premium / admin only. Computes descriptive stats + correlations in code, then
// asks Lovable AI to run the requested test and explain results.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}
function std(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
function pearson(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY belum dikonfigurasi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === AUTH ===
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Login dulu untuk pakai fitur AI", code: "AUTH_REQUIRED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await sbUser.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid, silakan login ulang", code: "AUTH_REQUIRED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // === PREMIUM CHECK ===
    const { data: roles } = await sbAdmin.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r: any) => r.role));
    const isPremium = roleSet.has("admin") || roleSet.has("premium");
    if (!isPremium) {
      return new Response(JSON.stringify({
        error: "Fitur Analisis Data AI hanya untuk member Premium.",
        code: "PREMIUM_REQUIRED",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const formId = String(body?.form_id ?? "").trim();
    const prompt = String(body?.prompt ?? "").trim();
    if (!formId) return new Response(JSON.stringify({ error: "Pilih form dulu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!prompt) return new Response(JSON.stringify({ error: "Prompt analisis kosong" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // === LOAD FORM (verify ownership) ===
    const { data: form } = await sbAdmin.from("forms").select("id,title,fields,owner_id").eq("id", formId).maybeSingle();
    if (!form) return new Response(JSON.stringify({ error: "Form tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (form.owner_id && form.owner_id !== userId && !roleSet.has("admin")) {
      return new Response(JSON.stringify({ error: "Kamu tidak punya akses ke form ini" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: responses } = await sbAdmin.from("form_responses").select("data").eq("form_id", formId).limit(2000);
    const rows = responses ?? [];
    if (rows.length < 3) {
      return new Response(JSON.stringify({ error: "Data terlalu sedikit untuk dianalisis (minimal 3 respon)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // `fields` may be a bare array OR an object like { _theme, fields: [...] }
    const rawFields: any = form.fields;
    const fields: any[] = Array.isArray(rawFields)
      ? rawFields
      : Array.isArray(rawFields?.fields)
        ? rawFields.fields
        : [];
    const idToLabel: Record<string, string> = {};
    fields.forEach((f, i) => { idToLabel[f.id] = (f.label && String(f.label).trim()) || `Variabel ${i + 1}`; });

    // Build column -> values
    const columns: Record<string, string[]> = {};
    for (const r of rows) {
      const d = (r as any).data || {};
      for (const [k, v] of Object.entries(d)) {
        const label = idToLabel[k] || k;
        (columns[label] ??= []).push(v == null ? "" : String(v));
      }
    }

    // Numeric columns + descriptive stats
    const numericCols: Record<string, number[]> = {};
    const descriptive: any[] = [];
    const categorical: any[] = [];
    for (const [label, vals] of Object.entries(columns)) {
      const nums = vals.map((v) => parseFloat(v)).filter((n) => !Number.isNaN(n));
      if (nums.length >= Math.max(3, vals.filter((v) => v !== "").length * 0.6)) {
        numericCols[label] = nums;
        descriptive.push({
          variabel: label, n: nums.length,
          mean: +mean(nums).toFixed(3), sd: +std(nums).toFixed(3),
          min: Math.min(...nums), max: Math.max(...nums),
        });
      } else {
        const freq: Record<string, number> = {};
        vals.forEach((v) => { if (v !== "") freq[v] = (freq[v] || 0) + 1; });
        categorical.push({ variabel: label, n: vals.filter((v) => v !== "").length, kategori: freq });
      }
    }

    // Correlation matrix
    const numNames = Object.keys(numericCols);
    const correlations: any[] = [];
    for (let i = 0; i < numNames.length; i++) {
      for (let j = i + 1; j < numNames.length; j++) {
        const a = numNames[i], b = numNames[j];
        const paired: [number, number][] = [];
        const av = numericCols[a], bv = numericCols[b];
        const len = Math.min(av.length, bv.length);
        for (let k = 0; k < len; k++) paired.push([av[k], bv[k]]);
        const r = pearson(paired.map((p) => p[0]), paired.map((p) => p[1]));
        if (r !== null) correlations.push({ a, b, r: +r.toFixed(3), n: len });
      }
    }

    const statsContext = {
      total_respon: rows.length,
      deskriptif: descriptive,
      kategorikal: categorical.slice(0, 20),
      korelasi_pearson: correlations,
    };

    const systemPrompt = `Kamu adalah ahli statistik & data analyst berbahasa Indonesia untuk platform survei FormGua.
Kamu diberi RINGKASAN STATISTIK yang SUDAH DIHITUNG dari data form (statistik deskriptif, frekuensi kategori, dan matriks korelasi Pearson). 
Gunakan angka-angka ini sebagai sumber kebenaran — JANGAN mengarang angka baru. Jika sebuah uji butuh data yang tidak tersedia, jelaskan keterbatasannya.
Jawab permintaan user (mis. uji korelasi, uji beda/t-test, ANOVA, regresi, chi-square, statistik deskriptif) dengan:
- interpretasi yang jelas dan mudah dipahami orang awam,
- sebutkan nilai statistik relevan (mis. koefisien r, arah & kekuatan hubungan),
- berikan kesimpulan praktis.
Format jawaban "report" dalam Markdown ringkas (boleh heading ##, bold, dan bullet). Bahasa Indonesia.
Isi "metrics" dengan 1-6 angka kunci paling penting (label singkat + value).`;

    const userPrompt = `JUDUL FORM: ${form.title}\nVARIABEL NUMERIK: ${numNames.join(", ") || "(tidak ada)"}\n\nRINGKASAN STATISTIK (JSON):\n${JSON.stringify(statsContext)}\n\nPERMINTAAN USER:\n${prompt}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "deliver_analysis",
            description: "Mengembalikan hasil analisis statistik",
            parameters: {
              type: "object",
              properties: {
                test_name: { type: "string", description: "Nama uji/analisis yang dilakukan" },
                report: { type: "string", description: "Penjelasan & interpretasi dalam Markdown" },
                metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" },
                      hint: { type: "string" },
                    },
                    required: ["label", "value"],
                    additionalProperties: false,
                  },
                },
                conclusion: { type: "string" },
              },
              required: ["test_name", "report"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "deliver_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Terlalu banyak permintaan ke AI, coba lagi sebentar." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Kredit AI workspace habis, silakan top up." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = {};
    try { parsed = JSON.parse(argsStr ?? "{}"); } catch { parsed = {}; }

    return new Response(JSON.stringify({
      test_name: parsed.test_name ?? "Analisis Data",
      report: parsed.report ?? "Tidak ada hasil.",
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      conclusion: parsed.conclusion ?? null,
      stats: statsContext,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("analyze-data-ai error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
