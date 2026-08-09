import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const TOUR_STORAGE_KEY = "has_seen_onboarding_tour";

export interface TourStep {
  /** Selector, or list of selectors tried in order (first existing wins). */
  target: string | string[];
  title: string;
  description: string;
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="ai-builder"]',
    title: "Buat Form via AI",
    description:
      "Klik di sini untuk membuat form baru: pilih tipe (Bebas, Responden, atau Kuis/Ujian), lalu tulis instruksi teks singkat — AI langsung menyusun pertanyaan lengkap dengan pilihan jawaban & pembahasan yang bisa kamu edit.",
  },
  {
    target: ['[data-tour="form-edit"]', '[data-tour="customizer"]'],
    title: "Kustomisasi Form & Tema",
    description:
      "Tombol Edit membuka Form Builder. Di sana kamu bisa menyusun ulang urutan soal, mengganti tema warna, mengunggah banner (sekaligus jadi gambar preview saat dibagikan), memasang proteksi kata sandi, batas waktu kuis, sampai halaman setelah submit.",
  },
  {
    target: ['[data-tour="form-responses"]', '[data-tour="gamification"]'],
    title: "Gamifikasi: Spin Wheel & Leaderboard",
    description:
      "Tombol Respons membuka halaman data form. Di tab Giveaway kamu bisa memutar Spin Wheel untuk mengundi hadiah e-wallet ke responden, dan untuk form Kuis peserta otomatis mendapat kode join + QR serta Papan Peringkat (Leaderboard) realtime.",
  },
  {
    target: ['[data-tour="ai-analysis"]', '[data-tour="analytics"]'],
    title: "Analisis Data AI",
    description:
      "Menu Analisis AI (khusus Premium) memakai dataset dari form kamu: ketik prompt seperti \"uji korelasi variabel A dengan B\" untuk mendapat tabel statistik deskriptif, korelasi Pearson, dan interpretasi AI yang bisa diunduh ke Excel atau Word.",
  },
  {
    target: ['[data-tour="analytics"]', '[data-tour="gamification"]'],
    title: "Statistik & Grafik Realtime",
    description:
      "Bagian Analitik menampilkan jumlah form, total respons, dan grafik tren respons yang ikut terupdate saat data baru masuk.",
  },
];

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8;

function resolve(target: string | string[]): string | null {
  const list = Array.isArray(target) ? target : [target];
  for (const sel of list) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el && (el.offsetWidth > 0 || el.offsetHeight > 0)) return sel;
  }
  return null;
}

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}


interface Props {
  steps?: TourStep[];
  open: boolean;
  onClose: () => void;
}

export function OnboardingTour({ steps = DASHBOARD_TOUR_STEPS, open, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Skip steps whose target does not exist (e.g. guest mode hides some UI)
  const visibleSteps = steps.filter((s) => !!resolve(s.target));
  const active = visibleSteps[index] ?? visibleSteps[0];
  const activeSelector = active ? resolve(active.target) : null;

  const measure = useCallback(() => {
    if (!activeSelector) return;
    const el = document.querySelector(activeSelector) as HTMLElement | null;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => setRect(getRect(activeSelector)), 320);
  }, [activeSelector]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
  }, [open, index, measure]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => activeSelector && setRect(getRect(activeSelector));

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, activeSelector]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open || !active || visibleSteps.length === 0) return null;

  const total = visibleSteps.length;
  const isLast = index === total - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 24);

  // Place card below the target if there's room, otherwise above
  const spaceBelow = rect ? vh - (rect.top + rect.height) : vh;
  const placeBelow = !rect || spaceBelow > 220;
  const cardTop = rect ? (placeBelow ? rect.top + rect.height + 14 : Math.max(12, rect.top - 210)) : vh / 2 - 100;
  const cardLeft = rect
    ? Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12)
    : vw / 2 - cardW / 2;
  const arrowLeft = rect ? Math.min(Math.max(16, rect.left + rect.width / 2 - cardLeft - 6), cardW - 28) : cardW / 2;

  const finish = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight hole */}
        <div className="absolute inset-0" onClick={finish}>
          {rect ? (
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute rounded-xl ring-2 ring-primary pointer-events-none"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.62)",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-foreground/60" />
          )}
        </div>

        {/* Popover card */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute"
          style={{ top: cardTop, left: cardLeft, width: cardW }}
        >
          {rect && placeBelow && (
            <div
              className="absolute -top-[7px] h-3.5 w-3.5 rotate-45 rounded-[2px] border-l border-t border-border bg-card"
              style={{ left: arrowLeft }}
            />
          )}
          {rect && !placeBelow && (
            <div
              className="absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 rounded-[2px] border-r border-b border-border bg-card"
              style={{ left: arrowLeft }}
            />
          )}
          <div className="relative rounded-xl border border-border bg-card p-4 shadow-2xl">
            <button
              onClick={finish}
              aria-label="Tutup tur"
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Langkah {index + 1} dari {total}
            </span>
            <h3 className="mt-2 text-sm font-bold">{active.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{active.description}</p>

            <div className="mt-3 flex items-center gap-1">
              {visibleSteps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-muted"}`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={finish}>
                Lewati Tur
              </Button>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIndex((i) => i - 1)}>
                    Sebelumnya
                  </Button>
                )}
                <Button size="sm" className="h-8 text-xs" onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}>
                  {isLast ? "Oke, Baik" : "Lanjut"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
