// Edge function: generate form fields from a natural language prompt using Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FREE_LIMIT = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY belum dikonfigurasi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === AUTH CHECK ===
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Login dulu untuk pakai fitur AI", code: "AUTH_REQUIRED" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await sbUser.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid, silakan login ulang", code: "AUTH_REQUIRED" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Check role
    const { data: roles } = await sbAdmin.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r: any) => r.role));
    const isUnlimited = roleSet.has("admin") || roleSet.has("premium");

    // Quota check
    let usage = 0;
    if (!isUnlimited) {
      const { data: prof } = await sbAdmin.from("profiles").select("ai_usage_count").eq("user_id", userId).maybeSingle();
      usage = prof?.ai_usage_count ?? 0;
      if (usage >= FREE_LIMIT) {
        return new Response(
          JSON.stringify({
            error: `Kuota AI gratis (${FREE_LIMIT}x) sudah habis. Upgrade ke Premium untuk pemakaian unlimited.`,
            code: "QUOTA_EXCEEDED",
            used: usage,
            limit: FREE_LIMIT,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    const formType = String(body?.form_type ?? "bebas");
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt kosong" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let typeGuide = "";
    let allowedTypes: string[] = [];
    if (formType === "ujian") {
      typeGuide =
        'Form KUIS/UJIAN. Gunakan tipe "exam_mc" (pilihan ganda dengan TEPAT 5 opsi A-E). WAJIB isi field "options" sebagai array berisi 5 string yaitu TEKS jawaban untuk A, B, C, D, E secara berurutan (BUKAN huruf "A","B","C","D","E", tapi isi/konten jawabannya — contoh: ["Jakarta","Bandung","Surabaya","Medan","Makassar"]). WAJIB isi answer_key dengan salah satu "A"|"B"|"C"|"D"|"E" yang menunjuk indeks opsi yang benar. points_correct default 10, points_wrong default 0. Boleh juga "text" atau "textarea" untuk soal isian dengan answer_key_text (kunci jawaban berupa teks). Default sebagian besar soal pakai exam_mc kecuali user minta esai/isian. Pastikan opsi pengecoh masuk akal dan hanya satu yang benar. WAJIB isi field "explanation" untuk SETIAP soal — berupa pembahasan/penjelasan jawaban yang benar (2-4 kalimat) supaya siswa bisa belajar dari kesalahan.';
      allowedTypes = ["exam_mc", "text", "textarea"];
    } else if (formType === "responden") {
      typeGuide =
        'Form RESPONDEN (Skala Likert). Semua field WAJIB pakai type "likert" dengan options ["1","2","3","4","5"]. Buat pernyataan-pernyataan yang bisa dijawab dengan skala Sangat Tidak Setuju → Sangat Setuju.';
      allowedTypes = ["likert"];
    } else {
      typeGuide =
        'Form BEBAS. Boleh kombinasi tipe: "text" (jawaban singkat), "textarea" (jawaban panjang), "radio" (pilihan tunggal, butuh options), "checkbox" (pilihan banyak, butuh options), "dropdown" (butuh options), "yesno", "number", "date", "email".';
      allowedTypes = ["text", "textarea", "radio", "checkbox", "dropdown", "yesno", "number", "date", "email"];
    }

    const systemPrompt = `Kamu adalah asisten yang membuat struktur form/kuis berbahasa Indonesia. ${typeGuide} Buat 3-12 pertanyaan berkualitas, label jelas dan ringkas, sesuai konteks user. Jangan menjelaskan apa-apa, cukup panggil tool generate_form_fields.`;

    const userPrompt = `Judul: ${title || "(belum)"}\nDeskripsi: ${description || "(belum)"}\nDetail dari user: ${prompt}\n\nBuat daftar pertanyaan yang sesuai.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_form_fields",
              description: "Mengembalikan daftar field/pertanyaan untuk form",
              parameters: {
                type: "object",
                properties: {
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: allowedTypes },
                        label: { type: "string" },
                        required: { type: "boolean" },
                        options: { type: "array", items: { type: "string" } },
                        answer_key: { type: "string", description: 'Khusus exam_mc: "A"|"B"|"C"|"D"|"E"' },
                        answer_key_text: { type: "string", description: "Khusus kuis text/textarea: kunci jawaban teks" },
                        points_correct: { type: "number" },
                        points_wrong: { type: "number" },
                        explanation: { type: "string", description: "Pembahasan/penjelasan jawaban (khusus kuis/ujian). Wajib untuk semua soal ujian." },
                      },
                      required: ["type", "label"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["fields"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_form_fields" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan ke AI, coba lagi sebentar." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI workspace habis, silakan top up." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      return new Response(JSON.stringify({ error: "AI tidak mengembalikan field" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: any;
    try {
      parsed = JSON.parse(argsStr);
    } catch {
      return new Response(JSON.stringify({ error: "Output AI tidak valid" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const EXAM_OPTS = ["A", "B", "C", "D", "E"];
    const LIKERT_OPTS = ["1", "2", "3", "4", "5"];

    const fields = (Array.isArray(parsed.fields) ? parsed.fields : [])
      .filter((f: any) => f && typeof f.label === "string" && allowedTypes.includes(f.type))
      .map((f: any) => {
        const base: any = {
          id: crypto.randomUUID(),
          type: f.type,
          label: String(f.label).slice(0, 500),
          required: typeof f.required === "boolean" ? f.required : f.type === "exam_mc",
        };
        if (f.type === "exam_mc") {
          const optsRaw = Array.isArray(f.options) ? f.options.map((o: any) => String(o ?? "").trim()) : [];
          const opts = [...optsRaw];
          while (opts.length < 5) opts.push(`Opsi ${EXAM_OPTS[opts.length]}`);
          base.options = opts.slice(0, 5);
          const ak = String(f.answer_key ?? "").toUpperCase();
          base.answer_key = EXAM_OPTS.includes(ak) ? ak : "A";
          base.points_correct = typeof f.points_correct === "number" ? f.points_correct : 10;
          base.points_wrong = typeof f.points_wrong === "number" ? f.points_wrong : 0;
          if (f.explanation) base.explanation = String(f.explanation).slice(0, 1000);
        } else if (f.type === "likert") {
          base.options = LIKERT_OPTS;
        } else if (["radio", "checkbox", "dropdown"].includes(f.type)) {
          base.options = Array.isArray(f.options) && f.options.length ? f.options.map(String) : ["Opsi 1", "Opsi 2"];
        } else if (formType === "ujian" && (f.type === "text" || f.type === "textarea")) {
          if (f.answer_key_text) base.answer_key_text = String(f.answer_key_text);
          base.points_correct = typeof f.points_correct === "number" ? f.points_correct : 10;
          base.points_wrong = typeof f.points_wrong === "number" ? f.points_wrong : 0;
          if (f.explanation) base.explanation = String(f.explanation).slice(0, 1000);
        }
        return base;
      });

    // Increment usage for non-premium users
    if (!isUnlimited) {
      await sbAdmin.from("profiles").update({ ai_usage_count: usage + 1 }).eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        fields,
        quota: { used: isUnlimited ? null : usage + 1, limit: isUnlimited ? null : FREE_LIMIT, unlimited: isUnlimited },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("generate-form-ai error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
