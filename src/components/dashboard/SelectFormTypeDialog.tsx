import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FileText, Users, GraduationCap } from "lucide-react";

export type FormType = "bebas" | "responden" | "ujian";

interface SelectFormTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FormType) => void;
}

const types: {
  value: FormType;
  title: string;
  desc: string;
  icon: typeof FileText;
  gradient: string;
  ring: string;
}[] = [
  {
    value: "bebas",
    title: "Form Bebas",
    desc: "Buat form sesuka hati. Bebas pilih tipe pertanyaan: teks, pilihan ganda, skala likert, upload file, dst.",
    icon: FileText,
    gradient: "from-indigo-500/20 to-purple-500/10",
    ring: "hover:ring-indigo-500/40 hover:border-indigo-500/40",
  },
  {
    value: "responden",
    title: "Form Responden",
    desc: "Khusus survei/kuesioner. Default tipe pertanyaan adalah skala likert (1-5). Tema tetap bisa dikustom.",
    icon: Users,
    gradient: "from-emerald-500/20 to-teal-500/10",
    ring: "hover:ring-emerald-500/40 hover:border-emerald-500/40",
  },
  {
    value: "ujian",
    title: "Form Kuis",
    desc: "Pilihan ganda A-E dengan kunci jawaban & poin per soal. Responden langsung lihat skor di akhir.",
    icon: GraduationCap,
    gradient: "from-amber-500/20 to-orange-500/10",
    ring: "hover:ring-amber-500/40 hover:border-amber-500/40",
  },
];

export function SelectFormTypeDialog({ open, onOpenChange, onSelect }: SelectFormTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Tipe Form</DialogTitle>
          <DialogDescription>Pilih jenis form yang ingin kamu buat</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {types.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.value}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(t.value)}
                className={`group relative overflow-hidden rounded-xl border border-border p-4 text-left transition-all ring-1 ring-transparent ${t.ring}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="relative space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">{t.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
