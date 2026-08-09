import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, GraduationCap, Link as LinkIcon, Download } from "lucide-react";
import { popup } from "@/lib/swal";

interface Props {
  joinCode: string | null;
  formId: string;
  slug: string | null;
}

export function QuizShareCard({ joinCode, formId, slug }: Props) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${origin}/form/${slug || formId}`;
  const joinUrl = joinCode ? `${origin}/kuis/${joinCode}` : formUrl;

  const copy = async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      popup.error("Gagal menyalin");
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById("quiz-qr-svg") as unknown as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `qr-kuis-${joinCode || formId}.png`;
        a.click();
      }, "image/png");
    };
    img.src = url;
  };

  const digits = useMemo(() => (joinCode || "").split(""), [joinCode]);

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Bagikan Kuis</h3>
          <p className="text-[11px] text-muted-foreground">Peserta bisa <b>scan QR</b> atau <b>input kode</b> di halaman gabung kuis.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-3">
          {/* Kode */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Kode Kuis</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1.5">
                {digits.length > 0 ? digits.map((d, i) => (
                  <span
                    key={i}
                    className="w-8 h-10 sm:w-9 sm:h-11 rounded-md bg-background border-2 border-primary/30 flex items-center justify-center font-mono text-lg sm:text-xl font-bold text-primary"
                  >
                    {d}
                  </span>
                )) : (
                  <span className="text-xs text-muted-foreground italic">Kode akan dibuat setelah disimpan.</span>
                )}
              </div>
              {joinCode && (
                <button
                  type="button"
                  onClick={() => copy(joinCode, "code")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  {copied === "code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "code" ? "Tersalin" : "Salin"}
                </button>
              )}
            </div>
          </div>

          {/* Link */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Link Gabung</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 rounded-md bg-background border border-border px-2 py-1.5 text-[11px] font-mono truncate">
                <LinkIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{joinUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copy(joinUrl, "link")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
              >
                {copied === "link" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === "link" ? "Tersalin" : "Salin"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Atau arahkan ke <a className="underline" href="/kuis" target="_blank" rel="noopener noreferrer">/kuis</a> lalu input kode di atas.
            </p>
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center gap-2 justify-self-center sm:justify-self-end">
          <div className="rounded-xl bg-white p-2.5 border border-border shadow-sm">
            <QRCodeSVG id="quiz-qr-svg" value={joinUrl} size={128} level="M" includeMargin={false} />
          </div>
          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <Download className="h-3 w-3" /> Unduh PNG
          </button>
        </div>
      </div>
    </div>
  );
}
