const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { formId, formTitle, responseData, cheatEvents } = await req.json();

    if (!formId || !formTitle) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get form to check notify settings
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("notify_enabled, notify_email")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return new Response(JSON.stringify({ error: "Form not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!form.notify_enabled || !form.notify_email) {
      return new Response(JSON.stringify({ message: "Notifications disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email content
    const dataRows = responseData
      ? Object.entries(responseData)
          .map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-size:13px;">${key}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:13px;">${value}</td></tr>`)
          .join("")
      : "<tr><td colspan='2' style='padding:8px;'>Data tersedia di dashboard</td></tr>";

    const cheatLabels: Record<string, string> = {
      tab_hidden: "Berpindah tab / minimize",
      window_blur: "Jendela kehilangan fokus",
      copy_attempt: "Mencoba menyalin teks",
      cut_attempt: "Mencoba memotong teks",
      contextmenu: "Klik kanan",
      print_screen: "Tombol PrintScreen",
      shortcut_blocked: "Pintasan keyboard terblokir",
    };

    const cheatHtml = Array.isArray(cheatEvents) && cheatEvents.length > 0
      ? `
        <div style="margin-top:16px;padding:12px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;">
          <h3 style="margin:0 0 8px;color:#b91c1c;font-size:14px;">⚠️ Aktivitas Mencurigakan Terdeteksi (${cheatEvents.length})</h3>
          <ul style="margin:0;padding-left:18px;color:#7f1d1d;font-size:12px;">
            ${cheatEvents.map((e: any) => `<li>${cheatLabels[e.type] || e.type} — ${new Date(e.at).toLocaleString("id-ID")}</li>`).join("")}
          </ul>
        </div>`
      : "";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;margin-bottom:4px;">📋 Respons Baru!</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:16px;">Form <strong>"${formTitle}"</strong> mendapat respons baru.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:12px;">Field</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:12px;">Jawaban</th>
            </tr>
          </thead>
          <tbody>${dataRows}</tbody>
        </table>
        ${cheatHtml}
        <p style="color:#9ca3af;font-size:11px;">Powered by FormCraft by rickthor7</p>
      </div>
    `;

    // Use Lovable AI gateway for sending email
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // For now, log the notification (email sending requires email domain setup)
    console.log(`Email notification would be sent to: ${form.notify_email}`);
    console.log(`Subject: Respons Baru - ${formTitle}`);
    console.log(`HTML length: ${html.length}`);

    return new Response(
      JSON.stringify({ 
        message: "Notification processed",
        email: form.notify_email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});