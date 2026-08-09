import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";
import { UpgradePremiumDialog } from "@/components/dashboard/UpgradePremiumDialog";
import {
  Sparkles, Loader2, Crown, BarChart3, Sigma, TrendingUp, FlaskConical, Lock, Database, Wand2,
  FileSpreadsheet, FileText,
} from "lucide-react";
import { exportAnalysisToExcel, exportAnalysisToWord } from "@/lib/analysisExport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { popup } from "@/lib/swal";

interface FormOpt { id: string; title: string; responseCount: number; }

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Uji korelasi antar variabel", prompt: "Lakukan uji korelasi Pearson antar semua variabel numerik dan jelaskan hubungan yang paling kuat beserta kekuatannya." },
  { icon: Sigma, label: "Statistik deskriptif", prompt: "Tampilkan statistik deskriptif (mean, standar deviasi, min, max) untuk setiap variabel dan beri ringkasan singkat." },
  { icon: FlaskConical, label: "Uji beda (t-test)", prompt: "Bandingkan rata-rata antar dua variabel dan jelaskan apakah perbedaannya berarti secara statistik." },
  { icon: BarChart3, label: "Analisis regresi", prompt: "Lakukan analisis regresi linear sederhana untuk memprediksi satu variabel dari variabel lain dan jelaskan hasilnya." },
  { icon: TrendingUp, label: "Variabel paling berpengaruh", prompt: "Identifikasi variabel mana yang paling berpengaruh terhadap hasil dan jelaskan alasannya berdasarkan data." },
  { icon: Sigma, label: "Ringkasan & insight", prompt: "Berikan ringkasan menyeluruh dari dataset ini beserta 3 insight utama yang bisa ditindaklanjuti." },
];

export default function DataAnalysis() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [forms, setForms] = useState<FormOpt[]>([]);
  const [formId, setFormId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const r = (roles ?? []).map((x: any) => x.role);
      setIsPremium(r.includes("premium") || r.includes("admin"));
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !isPremium) return;
    (async () => {
      const { data: formsData } = await supabase.from("forms").select("id,title").eq("owner_id", user.id).order("created_at", { ascending: false });
      const ids = (formsData ?? []).map((f: any) => f.id);
      const countMap: Record<string, number> = {};
      if (ids.length) {
        const { data: resp } = await supabase.from("form_responses").select("form_id").in("form_id", ids);
        resp?.forEach((r: any) => { countMap[r.form_id] = (countMap[r.form_id] || 0) + 1; });
      }
      setForms((formsData ?? []).map((f: any) => ({ id: f.id, title: f.title, responseCount: countMap[f.id] || 0 })));
    })();
  }, [user, isPremium]);

  const selectedForm = useMemo(() => forms.find((f) => f.id === formId), [forms, formId]);

  const runAnalysis = async () => {
    if (!formId) { popup.error("Pilih form yang ingin dianalisis"); return; }
    if (!prompt.trim()) { popup.error("Tulis dulu analisis yang kamu inginkan"); return; }
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-data-ai", {
        body: { form_id: formId, prompt: prompt.trim() },
      });
      if (error) {
        const ctx = (error as any)?.context;
        let msg = error.message;
        try { const j = ctx && (await ctx.json?.()); if (j?.error) msg = j.error; } catch { /* ignore */ }
        popup.error(msg || "Gagal menganalisis");
        return;
      }
      if (data?.error) { popup.error(data.error); return; }
      setResult(data);
    } catch (e: any) {
      popup.error(e?.message || "Gagal menghubungi AI");
    } finally {
      setRunning(false);
    }
  };

  if (authLoading || isPremium === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-3 sm:px-4 gap-2">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <h1 className="text-sm font-semibold truncate">Analisis Data AI</h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5">
                <Crown className="h-3 w-3" /> PREMIUM
              </span>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto">
            {!isPremium ? (
              <div className="max-w-xl mx-auto p-6 sm:p-10">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 p-8 text-center">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-extrabold mb-2">Fitur Premium</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Analisis Data AI memungkinkanmu menjalankan uji korelasi, uji beda, regresi, dan statistik deskriptif hanya dengan mengetik perintah. Tersedia untuk member Premium.
                  </p>
                  <Button onClick={() => setUpgradeOpen(true)} className="bg-amber-500 hover:bg-amber-600 gap-1.5">
                    <Crown className="h-4 w-4" /> Upgrade ke Premium
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto p-3 sm:p-5 md:p-8 space-y-5">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-5 sm:p-6">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Wand2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Tanya apa saja tentang datamu</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Pilih form, ketik analisis yang kamu mau, AI akan menghitung & menjelaskannya.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Input card */}
                <Card className="p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-primary" /> Pilih Dataset (Form)</label>
                    <Select value={formId} onValueChange={setFormId}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Pilih form yang punya respon..." /></SelectTrigger>
                      <SelectContent>
                        {forms.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-muted-foreground">Belum ada form</div>
                        ) : forms.map((f) => (
                          <SelectItem key={f.id} value={f.id} disabled={f.responseCount < 3}>
                            <span className="flex items-center gap-2">
                              {f.title}
                              <span className="text-[10px] text-muted-foreground">· {f.responseCount} respon</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedForm && selectedForm.responseCount < 3 && (
                      <p className="text-[11px] text-amber-600">Form ini butuh minimal 3 respon untuk dianalisis.</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Contoh Perintah Analisis</label>
                    <p className="text-[11px] text-muted-foreground -mt-0.5">Pilih salah satu contoh di bawah, atau tulis perintahmu sendiri.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUGGESTIONS.map((s) => {
                        const active = prompt === s.prompt;
                        return (
                          <button key={s.label} type="button" onClick={() => setPrompt(s.prompt)}
                            className={`flex items-start gap-2 rounded-xl border p-2.5 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:bg-primary/5 hover:border-primary/40"}`}>
                            <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-lg flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                              <s.icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-[11.5px] font-medium leading-snug">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                      placeholder="Contoh: Uji korelasi antara variabel motivasi dan nilai ujian, lalu jelaskan kekuatan hubungannya."
                      className="resize-none text-sm" />
                  </div>

                  <Button onClick={runAnalysis} disabled={running} className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 h-11">
                    {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Menganalisis...</> : <><Sparkles className="h-4 w-4" /> Jalankan Analisis</>}
                  </Button>
                </Card>

                {/* Result */}
                <AnimatePresence mode="wait">
                  {running && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Card className="p-6 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">AI sedang menghitung statistik dan menyusun interpretasi...</p>
                      </Card>
                    </motion.div>
                  )}
                  {!running && result && (
                    <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <Card className="overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b px-5 py-3 flex items-center gap-2 flex-wrap">
                          <FlaskConical className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="text-sm font-bold flex-1 min-w-0 truncate">{result.test_name}</h3>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                              onClick={() => exportAnalysisToExcel(result, selectedForm?.title || "form")}>
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Excel
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                              onClick={() => exportAnalysisToWord(result, selectedForm?.title || "form")}>
                              <FileText className="h-3.5 w-3.5 text-blue-600" /> Word
                            </Button>
                          </div>
                        </div>
                        {Array.isArray(result.metrics) && result.metrics.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border-b bg-secondary/30">
                            {result.metrics.map((m: any, i: number) => (
                              <div key={i} className="rounded-xl border bg-background p-3">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{m.label}</p>
                                <p className="text-lg font-extrabold text-primary">{m.value}</p>
                                {m.hint && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{m.hint}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="p-5">
                          <Markdown content={result.report} />
                          {result.conclusion && (
                            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">Kesimpulan</p>
                              <p className="text-sm text-foreground/90 leading-relaxed">{result.conclusion}</p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Computed statistics */}
                      {result.stats && (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {Array.isArray(result.stats.deskriptif) && result.stats.deskriptif.length > 0 && (
                            <Card className="overflow-hidden">
                              <div className="border-b px-4 py-2.5 flex items-center gap-2 bg-secondary/40">
                                <Sigma className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-bold">Statistik Deskriptif</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground border-b">
                                      <th className="text-left font-medium px-3 py-2">Variabel</th>
                                      <th className="text-right font-medium px-2 py-2">N</th>
                                      <th className="text-right font-medium px-2 py-2">Mean</th>
                                      <th className="text-right font-medium px-2 py-2">SD</th>
                                      <th className="text-right font-medium px-2 py-2">Min</th>
                                      <th className="text-right font-medium px-3 py-2">Max</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {result.stats.deskriptif.map((d: any, i: number) => (
                                      <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                                        <td className="px-3 py-2 font-medium truncate max-w-[140px]">{d.variabel}</td>
                                        <td className="px-2 py-2 text-right tabular-nums">{d.n}</td>
                                        <td className="px-2 py-2 text-right tabular-nums">{d.mean}</td>
                                        <td className="px-2 py-2 text-right tabular-nums">{d.sd}</td>
                                        <td className="px-2 py-2 text-right tabular-nums">{d.min}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{d.max}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Card>
                          )}

                          {Array.isArray(result.stats.korelasi_pearson) && result.stats.korelasi_pearson.length > 0 && (
                            <Card className="overflow-hidden">
                              <div className="border-b px-4 py-2.5 flex items-center gap-2 bg-secondary/40">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-bold">Korelasi Pearson</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground border-b">
                                      <th className="text-left font-medium px-3 py-2">Variabel A</th>
                                      <th className="text-left font-medium px-2 py-2">Variabel B</th>
                                      <th className="text-right font-medium px-2 py-2">r</th>
                                      <th className="text-right font-medium px-3 py-2">Kekuatan</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {result.stats.korelasi_pearson.map((c: any, i: number) => {
                                      const abs = Math.abs(c.r);
                                      const strength = abs >= 0.7 ? "Kuat" : abs >= 0.4 ? "Sedang" : abs >= 0.2 ? "Lemah" : "Sangat lemah";
                                      const color = abs >= 0.7 ? "text-accent" : abs >= 0.4 ? "text-primary" : "text-muted-foreground";
                                      return (
                                        <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                                          <td className="px-3 py-2 font-medium truncate max-w-[110px]">{c.a}</td>
                                          <td className="px-2 py-2 font-medium truncate max-w-[110px]">{c.b}</td>
                                          <td className={`px-2 py-2 text-right tabular-nums font-bold ${color}`}>{c.r}</td>
                                          <td className="px-3 py-2 text-right text-muted-foreground">{strength}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </Card>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">
                        Hasil analisis dibantu AI. Untuk publikasi ilmiah, verifikasi kembali dengan perangkat statistik formal.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>
      <UpgradePremiumDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </SidebarProvider>
  );
}
