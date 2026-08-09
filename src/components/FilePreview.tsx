import { Download, FileText, ImageIcon, ExternalLink } from "lucide-react";
import { parseFileAnswer, isImageUrl } from "@/lib/fileUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface FilePreviewProps {
  value: string;
  compact?: boolean;
}

export function FilePreview({ value, compact = false }: FilePreviewProps) {
  const [open, setOpen] = useState(false);
  const { url, name } = parseFileAnswer(value);

  if (!value) return <span className="text-muted-foreground">-</span>;
  if (!url) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span className="truncate max-w-[140px]">{name}</span>
      </span>
    );
  }

  const isImage = isImageUrl(url);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // fallback: open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (compact) {
    return (
      <>
        <div className="inline-flex items-center gap-1.5">
          {isImage ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group relative h-10 w-10 rounded-md overflow-hidden border border-border bg-muted shrink-0"
              title={name}
            >
              <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate max-w-[100px]">{name}</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            title="Unduh"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isImage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-medium pr-8">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
                <img src={url} alt={name} className="max-h-[70vh] w-auto object-contain" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka
                  </a>
                </Button>
                <Button size="sm" onClick={handleDownload} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      {isImage ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-16 w-16 rounded-md overflow-hidden border border-border bg-muted shrink-0"
        >
          <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
        </button>
      ) : (
        <div className="h-16 w-16 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{isImage ? "Gambar" : "File"}</p>
      </div>
      <Button size="sm" onClick={handleDownload} className="gap-1.5 shrink-0">
        <Download className="h-3.5 w-3.5" />
        Unduh
      </Button>

      {isImage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm truncate pr-8">{name}</DialogTitle>
            </DialogHeader>
            <img src={url} alt={name} className="max-h-[70vh] w-auto object-contain mx-auto" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
