import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PasswordGate } from "@/components/PasswordGate";
import { GiveawaySpinWheel } from "@/components/dashboard/GiveawaySpinWheel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { popup } from "@/lib/swal";
import { ArrowLeft, Download, FileText, BarChart3, Table2, Eye, Gift, FileSpreadsheet, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SummaryView } from "@/components/dashboard/SummaryView";
import { FilePreview } from "@/components/FilePreview";
import { parseFileAnswer } from "@/lib/fileUpload";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  answer_key?: string;
  points_correct?: number;
  points_wrong?: number;
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  fields: FormField[];
  created_at: string;
  giveaway_enabled: boolean;
  form_type: "bebas" | "responden" | "ujian";
}

interface Response {
  id: string;
  data: Record<string, string>;
  completed: boolean;
  created_at: string;
  score?: number | null;
  max_score?: number | null;
  correct_count?: number | null;
  wrong_count?: number | null;
}

export default function FormResponses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "summary" | "giveaway">("table");
  const [formPassword, setFormPassword] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [expandedCheat, setExpandedCheat] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("forms").select("*").eq("id", id).single(),
      supabase.from("form_responses").select("*").eq("form_id", id).order("created_at", { ascending: false }),
    ]).then(([formRes, respRes]) => {
      if (formRes.error || !formRes.data) { popup.error("Form tidak ditemukan"); navigate("/dashboard"); return; }
      setFormTitle(formRes.data.title);
      setFormPassword((formRes.data as any).password || null);
      if (!(formRes.data as any).password) setUnlocked(true);
      
      const raw = formRes.data.fields as any;
      let fields: FormField[] = [];
      if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.fields) {
        fields = raw.fields || [];
      } else {
        fields = (Array.isArray(raw) ? raw : []) as unknown as FormField[];
      }
      
      setForm({
        ...formRes.data,
        fields,
        giveaway_enabled: (formRes.data as any).giveaway_enabled || false,
        form_type: ((formRes.data as any).form_type || "bebas") as FormData["form_type"],
      });
      setResponses((respRes.data || []).map((r: any) => ({
        id: r.id,
        data: typeof r.data === "object" && r.data !== null ? r.data as Record<string, string> : {},
        completed: r.completed,
        created_at: r.created_at,
        score: r.score,
        max_score: r.max_score,
        correct_count: r.correct_count,
        wrong_count: r.wrong_count,
      })));
      setLoading(false);
    });
  }, [id]);

  const getExportData = () => {
    if (!form || responses.length === 0) { popup.error("Tidak ada data untuk diekspor"); return null; }
    const headers = ["No", "Waktu", ...form.fields.map(f => f.label), "Status"];
    const rows = responses.map((r, i) => [
      i + 1,
      new Date(r.created_at).toLocaleString("id-ID"),
      ...form.fields.map(f => {
        const val = (r.data[f.id] || "").toString();
        if (f.type === "file" && val) {
          const { url, name } = parseFileAnswer(val);
          return url ? `${name} (${url})` : name;
        }
        return val;
      }),
      r.completed ? "Selesai" : "Belum Selesai",
    ]);
    return { headers, rows };
  };

  const exportCSV = () => {
    const data = getExportData();
    if (!data) return;
    const csv = [data.headers.join(","), ...data.rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form!.title.replace(/[^a-zA-Z0-9]/g, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    popup.success("Data berhasil diekspor sebagai CSV!");
  };

  const exportXLSX = async () => {
    const data = getExportData();
    if (!data) return;
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    // Auto column widths
    ws["!cols"] = data.headers.map((h, i) => ({
      wch: Math.max(h.length, ...data.rows.map(r => String(r[i]).length)) + 2,
    }));
    XLSX.writeFile(wb, `${form!.title.replace(/[^a-zA-Z0-9]/g, "_")}_responses.xlsx`);
    popup.success("Data berhasil diekspor sebagai Excel!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!unlocked && formPassword) {
    return (
      <PasswordGate
        formTitle={formTitle}
        onUnlock={() => setUnlocked(true)}
        checkPassword={(pw) => pw === formPassword}
      />
    );
  }

  if (!form) return null;

  const completedCount = responses.filter(r => r.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-4 h-14 gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${id}`)} className="gap-1.5 h-8 text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Form</span>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <a href={`/form/${id}`} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lihat</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ekspor</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV} className="gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Ekspor CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportXLSX} className="gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Ekspor Excel (XLSX)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
          {form.description && <p className="text-muted-foreground mt-1">{form.description}</p>}
        </div>

        {/* Panel Kunci Jawaban (khusus Form Kuis) */}
        {form.form_type === "ujian" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
              🔑 Kunci Jawaban
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {form.fields.filter(f => f.type === "exam_mc").map((f, idx) => {
                const keyIdx = f.answer_key ? f.answer_key.charCodeAt(0) - 65 : -1;
                const keyText = keyIdx >= 0 ? (f.options?.[keyIdx] ?? "") : "";
                return (
                  <div key={f.id} className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                    <span className="text-xs text-muted-foreground shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" title={f.label}>{f.label}</p>
                      {keyText && <p className="text-[10px] text-muted-foreground truncate" title={keyText}>{keyText}</p>}
                    </div>
                    <span className="h-7 w-7 rounded-md bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{f.answer_key || "?"}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">+{f.points_correct ?? 10}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel Aktivitas Mencurigakan (khusus Form Kuis) */}
        {form.form_type === "ujian" && (() => {
          const cheatLabels: Record<string, string> = {
            tab_hidden: "Berpindah tab / minimize",
            window_blur: "Jendela kehilangan fokus",
            copy_attempt: "Mencoba menyalin teks",
            cut_attempt: "Mencoba memotong teks",
            contextmenu: "Klik kanan",
            print_screen: "Tombol PrintScreen",
            shortcut_blocked: "Pintasan keyboard terblokir",
          };
          const cheaters = responses
            .map((r) => {
              const events = Array.isArray((r.data as any)?.__cheat_events)
                ? ((r.data as any).__cheat_events as Array<{ type: string; at: string; message?: string }>)
                : [];
              const nameField = form.fields.find((f) => /nama|name/i.test(f.label));
              const name = nameField ? (r.data[nameField.id] || "Tanpa Nama") : "Tanpa Nama";
              return { id: r.id, name, created_at: r.created_at, events };
            })
            .filter((c) => c.events.length > 0)
            .sort((a, b) => b.events.length - a.events.length);

          const totalViolations = cheaters.reduce((s, c) => s + c.events.length, 0);

          return (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Aktivitas Mencurigakan
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {cheaters.length} responden · {totalViolations} pelanggaran
                </span>
              </h3>
              {cheaters.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada aktivitas mencurigakan terdeteksi. 🎉</p>
              ) : (
                <div className="space-y-2">
                  {cheaters.map((c) => {
                    const isOpen = expandedCheat === c.id;
                    const counts = c.events.reduce<Record<string, number>>((acc, e) => {
                      acc[e.type] = (acc[e.type] || 0) + 1;
                      return acc;
                    }, {});
                    return (
                      <div key={c.id} className="rounded-lg border border-rose-500/20 bg-background overflow-hidden">
                        <button
                          onClick={() => setExpandedCheat(isOpen ? null : c.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-500/5 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="hidden sm:flex flex-wrap gap-1 max-w-[50%] justify-end">
                            {Object.entries(counts).map(([t, n]) => (
                              <span key={t} className="text-[10px] rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5">
                                {cheatLabels[t] || t}: {n}
                              </span>
                            ))}
                          </div>
                          <span className="shrink-0 inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md bg-rose-500 text-white text-xs font-bold">
                            {c.events.length}×
                          </span>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="border-t border-rose-500/20 bg-rose-500/5 px-3 py-2">
                            <ul className="space-y-1.5">
                              {c.events.map((e, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">
                                      {cheatLabels[e.type] || e.type}
                                    </p>
                                    {e.message && (
                                      <p className="text-muted-foreground text-[11px]">{e.message}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {new Date(e.at).toLocaleString("id-ID")}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Respons", value: responses.length, color: "text-primary" },
            { label: "Selesai", value: completedCount, color: "text-emerald-500" },
            { label: "Belum Selesai", value: responses.length - completedCount, color: "text-amber-500" },
            { label: form.form_type === "ujian" ? "Rata-rata Skor" : "Jumlah Field",
              value: form.form_type === "ujian"
                ? (responses.filter(r => typeof r.score === "number").length > 0
                    ? Math.round(responses.filter(r => typeof r.score === "number").reduce((s, r) => s + (r.score || 0), 0) / responses.filter(r => typeof r.score === "number").length)
                    : 0)
                : form.fields.length,
              color: "text-muted-foreground" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
            <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView("summary")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "summary" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            {form.giveaway_enabled && (
              <button onClick={() => setView("giveaway")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "giveaway" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                <Gift className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {view === "table" ? "Tabel Data" : view === "summary" ? "Ringkasan" : "Giveaway"}
          </span>
        </div>

        {view === "giveaway" && form.giveaway_enabled ? (
          <GiveawaySpinWheel formId={form.id} formTitle={form.title} />
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada respons</p>
            <p className="text-xs text-muted-foreground mt-1">Bagikan link form untuk mulai mengumpulkan data</p>
          </div>
        ) : view === "table" ? (
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 whitespace-nowrap">No</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 whitespace-nowrap">Waktu</th>
                  {form.form_type === "ujian" && (
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 whitespace-nowrap">Skor</th>
                  )}
                  {form.fields.map(f => (
                    <th key={f.id} className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 whitespace-nowrap">
                      {f.label}
                      {form.form_type === "ujian" && f.answer_key && (
                        <span className="ml-1 text-emerald-500 font-bold">[{f.answer_key}]</span>
                      )}
                    </th>
                  ))}
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 sm:px-4 py-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 sm:px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 sm:px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                    {form.form_type === "ujian" && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        {typeof r.score === "number" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-bold">
                            {r.score}/{r.max_score ?? "-"}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({r.correct_count ?? 0}✓ {r.wrong_count ?? 0}✗)
                            </span>
                          </span>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                    )}
                    {form.fields.map(f => {
                      const val = r.data[f.id] || "";
                      const isExamCorrect = form.form_type === "ujian" && f.type === "exam_mc" && f.answer_key && val === f.answer_key;
                      const isExamWrong = form.form_type === "ujian" && f.type === "exam_mc" && f.answer_key && val && val !== f.answer_key;
                      let displayVal: any = val || "-";
                      if (f.type === "exam_mc" && val) {
                        const idx2 = val.charCodeAt(0) - 65;
                        const txt = f.options?.[idx2] ?? "";
                        displayVal = txt ? `${val}. ${txt}` : val;
                      }
                      return (
                        <td key={f.id} className={`px-3 sm:px-4 py-3 ${f.type === "file" ? "" : "max-w-[150px] sm:max-w-[200px] truncate"} text-xs sm:text-sm ${isExamCorrect ? "text-emerald-600 dark:text-emerald-400 font-semibold" : isExamWrong ? "text-rose-600 dark:text-rose-400 font-semibold" : ""}`}>
                          {f.type === "file"
                            ? (r.data[f.id] ? <FilePreview value={r.data[f.id]} compact /> : <span className="text-muted-foreground">-</span>)
                            : displayVal}
                        </td>
                      );
                    })}
                    <td className="px-3 sm:px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${r.completed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                        {r.completed ? "Selesai" : "Belum"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <SummaryView form={form} responses={responses} />
        )}
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FormGua by rickthor7
        </div>
      </footer>
    </div>
  );
}