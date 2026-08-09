import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trash2, FileText, BarChart3, LayoutGrid, Pencil, ChartBar, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  responseCount: number;
  slug?: string | null;
}

interface FormManagerProps {
  forms: Form[];
  onCreateForm: () => void;
  onDeleteForm: (id: string) => void;
  onDuplicateForm: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  active: "Aktif",
  draft: "Draf",
  closed: "Ditutup",
};

function getFormUrl(form: Form) {
  return `/form/${form.slug || form.id}`;
}

type ViewMode = "table" | "card";

export function FormManager({ forms, onCreateForm, onDeleteForm, onDuplicateForm }: FormManagerProps) {
  const [view, setView] = useState<ViewMode>("card");

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight shrink-0">Form</h2>
        <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
          <button
            onClick={() => setView("table")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            aria-label="Tampilan tabel"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView("card")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "card" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            aria-label="Tampilan kartu"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {forms.length === 0 ? (
        <EmptyState onCreateForm={onCreateForm} />
      ) : view === "table" ? (
        <TableView forms={forms} onDeleteForm={onDeleteForm} onDuplicateForm={onDuplicateForm} />
      ) : (
        <CardView forms={forms} onDeleteForm={onDeleteForm} onDuplicateForm={onDuplicateForm} />
      )}
    </div>
  );
}

function EmptyState({ onCreateForm }: { onCreateForm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-xl border border-dashed border-border"
    >
      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-1">Belum ada form</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6 text-center px-4">Buat form pertamamu dan mulai kumpulkan data</p>
    </motion.div>
  );
}

function ActionButtons({
  form,
  onDeleteForm,
  onDuplicateForm,
  align = "end",
}: {
  form: Form;
  onDeleteForm: (id: string) => void;
  onDuplicateForm: (id: string) => void;
  align?: "start" | "end";
}) {
  const actions = [
    { icon: Pencil, label: "Edit", tour: "form-edit", to: `/builder/${form.id}`, className: "text-muted-foreground hover:text-primary hover:bg-primary/10" },
    { icon: ChartBar, label: "Respons", tour: "form-responses", to: `/responses/${form.id}`, className: "text-muted-foreground hover:text-accent hover:bg-accent/10" },
    { icon: ExternalLink, label: "Buka", tour: undefined as string | undefined, to: getFormUrl(form), className: "text-muted-foreground hover:text-foreground hover:bg-muted" },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`flex items-center gap-0.5 sm:gap-1 ${align === "end" ? "justify-end" : ""}`}>
        {actions.map((a) => (
          <Tooltip key={a.label}>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={`h-7 w-7 sm:h-8 sm:w-8 ${a.className}`}
                data-tour={a.tour}
              >
                <Link to={a.to} aria-label={a.label}>
                  <a.icon className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">{a.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onDuplicateForm(form.id)}
              aria-label="Duplikasi"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">Duplikasi</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteForm(form.id)}
              aria-label="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">Hapus</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function TableView({ forms, onDeleteForm, onDuplicateForm }: { forms: Form[]; onDeleteForm: (id: string) => void; onDuplicateForm: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <table className="w-full min-w-[420px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3">Nama Form</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 hidden sm:table-cell">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 hidden md:table-cell">Respons</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {forms.map((form, i) => (
              <motion.tr
                key={form.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-3 sm:px-4 py-3">
                  <p className="font-medium text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">{form.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[form.status]}`}>{statusLabels[form.status]}</Badge>
                    <span className="text-[10px] text-muted-foreground">{form.responseCount} respons</span>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                  <Badge variant="outline" className={`text-[10px] sm:text-xs ${statusStyles[form.status]}`}>{statusLabels[form.status]}</Badge>
                </td>
                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{form.responseCount}</td>
                <td className="px-2 sm:px-3 py-2">
                  <ActionButtons form={form} onDeleteForm={onDeleteForm} onDuplicateForm={onDuplicateForm} />
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

function CardView({ forms, onDeleteForm, onDuplicateForm }: { forms: Form[]; onDeleteForm: (id: string) => void; onDuplicateForm: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <AnimatePresence>
        {forms.map((form, i) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-3 sm:p-4 group hover:glow-ring transition-shadow duration-300 flex flex-col"
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <Badge variant="outline" className={`text-[10px] sm:text-xs shrink-0 ${statusStyles[form.status]}`}>{statusLabels[form.status]}</Badge>
              <span className="text-[10px] text-muted-foreground">{new Date(form.created_at).toLocaleDateString("id-ID")}</span>
            </div>
            <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate">{form.title}</h3>
            {form.description && <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 line-clamp-2">{form.description}</p>}
            <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border">
              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{form.responseCount} respons</span>
              <ActionButtons form={form} onDeleteForm={onDeleteForm} onDuplicateForm={onDuplicateForm} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
