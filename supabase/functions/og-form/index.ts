// Edge Function: og-form
// Renders SSR HTML with dynamic Open Graph / Twitter meta tags for a specific
// form, so social crawlers (WhatsApp, Facebook, Twitter, LinkedIn, Telegram,
// Slack, Discord, etc.) can read accurate previews when a /form/:idOrSlug link
// is shared. Real users get redirected to the SPA via meta-refresh + JS.
//
// This function is intentionally public (no auth) — it only reads form
// metadata (title, description, banner). RLS already allows public SELECT
// on `forms`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, user-agent",
};

const SITE_URL = "https://formgua.web.id";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/6rHbGUFX9MWFOqdb5pw4RBSmd963/social-images/social-1776898656846-1000737518.webp";

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s: string, max: number) => {
  const v = String(s ?? "").replace(/\s+/g, " ").trim();
  if (v.length <= max) return v;
  return v.slice(0, max - 1).trimEnd() + "…";
};

const isLikelyUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Accept ?idOrSlug=... (preferred) or trailing path segment after /og-form/
    let idOrSlug = url.searchParams.get("idOrSlug") || url.searchParams.get("id") || "";
    if (!idOrSlug) {
      const parts = url.pathname.split("/").filter(Boolean);
      idOrSlug = parts[parts.length - 1] || "";
      if (idOrSlug === "og-form") idOrSlug = "";
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    let form: any = null;
    if (idOrSlug) {
      const col = isLikelyUuid(idOrSlug) ? "id" : "slug";
      const { data } = await supabase
        .from("forms")
        .select("id,title,description,banner_url,og_image_url,form_type,slug,status")
        .eq(col, idOrSlug)
        .maybeSingle();
      form = data;
    }

    const title = truncate(
      form?.title ? `${form.title} — FormGua` : "FormGua — Form Builder Gratis",
      80,
    );
    const description = truncate(
      form?.description ||
        (form?.form_type === "ujian"
          ? "Ikut kuis online di FormGua. Anti-cheat, langsung lihat skor di akhir."
          : "Isi form di FormGua — gratis, tanpa login wajib, dan anti-monoton."),
      180,
    );
    const image = form?.og_image_url || form?.banner_url || DEFAULT_OG_IMAGE;
    const canonical = form
      ? `${SITE_URL}/form/${form.slug || form.id}`
      : `${SITE_URL}${url.pathname}`;

    const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />

<!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="FormGua" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="id_ID" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@rickthor7" />
<meta name="twitter:creator" content="@rickthor7" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<!-- Bila bukan crawler, langsung redirect ke SPA -->
<meta http-equiv="refresh" content="0; url=${escapeHtml(canonical)}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b0f;color:#e8e8ee;margin:0;padding:32px;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{max-width:560px;text-align:center}
  .card img{max-width:100%;border-radius:12px;margin-bottom:16px}
  a{color:#818cf8}
</style>
</head>
<body>
<div class="card">
  <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />
  <h1 style="font-size:1.25rem;margin:8px 0">${escapeHtml(title)}</h1>
  <p style="color:#a1a1aa;font-size:.95rem">${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(canonical)}">Buka form &rarr;</a></p>
</div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        // Crawler caching — sosmed cache lama, kasih sedikit waktu refresh
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>FormGua</title>` +
        `<meta name="description" content="FormGua — Form Builder Gratis">` +
        `<p>Form tidak ditemukan.</p>`,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
});
