import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronRight, ChevronLeft, CheckCircle2, Upload, FileText, Gift, Smartphone, Loader2, Award, XCircle, Trophy, Clock, AlertTriangle, ExternalLink, Download } from "lucide-react";
import jsPDF from "jspdf";
import { popup } from "@/lib/swal";
import { uploadFormFile, parseFileAnswer, isImageUrl } from "@/lib/fileUpload";
import { QuizLeaderboard } from "@/components/QuizLeaderboard";

interface ConditionalRule {
  parentId: string;
  showIfValue: string;
}

interface ConditionalRule {
  parentId: string;
  showIfValue: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  conditional?: ConditionalRule;
  // Khusus form kuis
  answer_key?: string;
  points_correct?: number;
  points_wrong?: number;
  // Khusus kuis tipe teks
  answer_key_text?: string;
  answer_case_insensitive?: boolean;
  answer_fuzzy_tolerance?: number;
  // Khusus likert: orientasi tampilan
  likertOrientation?: "horizontal" | "vertical";
  // Gambar pendukung soal (opsional)
  image_url?: string;
  // Pembahasan soal untuk kuis (ditampilkan di hasil, terutama jika salah)
  explanation?: string;
}

interface FormTheme {
  buttonStyle: "default" | "rounded" | "pill" | "outline" | "gradient" | "glow" | "soft";
  accentColor: string;
  bannerFit?: "cover" | "contain";
}

type FormType = "bebas" | "responden" | "ujian";

interface FormData {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  theme: FormTheme;
  giveaway_enabled: boolean;
  giveaway_ewallets: string[];
  layout_mode: "paginated" | "scroll";
  banner_url: string | null;
  og_image_url: string | null;
  form_type: FormType;
  quiz_time_limit: number | null;
  success_message: string | null;
  success_links: Array<{ label: string; url: string }>;
}

interface ExamResult {
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  details: { fieldId: string; label: string; userAnswer: string; userAnswerText: string; correctAnswer: string; correctAnswerText: string; isCorrect: boolean; points: number; maxPoints: number; explanation?: string }[];
}

const colorVars: Record<string, { bg: string; text: string; ring: string; gradient: string; light: string; border: string }> = {
  indigo: { bg: "bg-indigo-500", text: "text-indigo-500", ring: "ring-indigo-500/30", gradient: "from-indigo-500 to-purple-500", light: "bg-indigo-500/10", border: "border-indigo-500/30" },
  cyan: { bg: "bg-cyan-500", text: "text-cyan-500", ring: "ring-cyan-500/30", gradient: "from-cyan-500 to-blue-500", light: "bg-cyan-500/10", border: "border-cyan-500/30" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/30", gradient: "from-emerald-500 to-teal-500", light: "bg-emerald-500/10", border: "border-emerald-500/30" },
  rose: { bg: "bg-rose-500", text: "text-rose-500", ring: "ring-rose-500/30", gradient: "from-rose-500 to-pink-500", light: "bg-rose-500/10", border: "border-rose-500/30" },
  amber: { bg: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/30", gradient: "from-amber-500 to-orange-500", light: "bg-amber-500/10", border: "border-amber-500/30" },
  violet: { bg: "bg-violet-500", text: "text-violet-500", ring: "ring-violet-500/30", gradient: "from-violet-500 to-indigo-500", light: "bg-violet-500/10", border: "border-violet-500/30" },
  teal: { bg: "bg-teal-500", text: "text-teal-500", ring: "ring-teal-500/30", gradient: "from-teal-400 to-emerald-500", light: "bg-teal-500/10", border: "border-teal-500/30" },
  pink: { bg: "bg-pink-500", text: "text-pink-500", ring: "ring-pink-500/30", gradient: "from-pink-500 to-fuchsia-500", light: "bg-pink-500/10", border: "border-pink-500/30" },
  orange: { bg: "bg-orange-500", text: "text-orange-500", ring: "ring-orange-500/30", gradient: "from-orange-400 to-red-500", light: "bg-orange-500/10", border: "border-orange-500/30" },
  slate: { bg: "bg-slate-700", text: "text-slate-700", ring: "ring-slate-500/30", gradient: "from-slate-700 to-slate-900", light: "bg-slate-500/10", border: "border-slate-500/30" },
};

export default function PublicForm() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [form, setForm] = useState<FormData | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [giveawayPhone, setGiveawayPhone] = useState("");
  const [giveawayEwallet, setGiveawayEwallet] = useState("");
  const [giveawaySubmitted, setGiveawaySubmitted] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const submitRef = useRef<() => Promise<void>>();
  const submittedRef = useRef(false);
  // Anti-cheat: catatan pelanggaran selama mengerjakan kuis
  const [cheatEvents, setCheatEvents] = useState<Array<{ type: string; at: string }>>([]);
  const [showCheatWarning, setShowCheatWarning] = useState<string | null>(null);
  const cheatEventsRef = useRef<Array<{ type: string; at: string }>>([]);
  const [participantName, setParticipantName] = useState<string>("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const recordCheat = (type: string, message: string) => {
    if (submittedRef.current) return;
    const evt = { type, at: new Date().toISOString() };
    cheatEventsRef.current = [...cheatEventsRef.current, evt];
    setCheatEvents(cheatEventsRef.current);
    setShowCheatWarning(message);
  };

  const handleFileUpload = async (fieldId: string, file: File | undefined) => {
    if (!file || !form) return;
    setUploadingFields((p) => ({ ...p, [fieldId]: true }));
    try {
      const encoded = await uploadFormFile(form.id, file);
      setAnswers((prev) => ({ ...prev, [fieldId]: encoded }));
      popup.success("File berhasil diupload");
    } catch (err: any) {
      popup.error(err?.message || "Gagal upload file");
    } finally {
      setUploadingFields((p) => ({ ...p, [fieldId]: false }));
    }
  };

  useEffect(() => {
    if (!idOrSlug) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const query = isUuid
      ? supabase.from("forms").select("*").eq("id", idOrSlug).single()
      : supabase.from("forms").select("*").eq("slug", idOrSlug).single();
    
    query.then(({ data, error }) => {
      if (error || !data) { popup.error("Form tidak ditemukan"); setLoading(false); return; }
      const raw = data.fields as any;
      let fields: FormField[] = [];
      let theme: FormTheme = { buttonStyle: "default", accentColor: "indigo" };
      if (raw && typeof raw === "object" && !Array.isArray(raw) && raw._theme) {
        fields = raw.fields || [];
        theme = raw._theme;
      } else {
        fields = (Array.isArray(raw) ? raw : []) as FormField[];
      }
      const rawLinks = (data as any).success_links;
      const successLinks = Array.isArray(rawLinks)
        ? rawLinks.filter((x: any) => x && typeof x === "object" && x.label && x.url).map((x: any) => ({ label: String(x.label), url: String(x.url) }))
        : [];
      const formData: FormData = { id: data.id, title: data.title, description: data.description, fields, theme, giveaway_enabled: (data as any).giveaway_enabled || false, giveaway_ewallets: (data as any).giveaway_ewallets || [], layout_mode: ((data as any).layout_mode === "scroll" ? "scroll" : "paginated"), banner_url: (data as any).banner_url || null, og_image_url: (data as any).og_image_url || null, form_type: ((data as any).form_type || "bebas") as FormType, quiz_time_limit: (data as any).quiz_time_limit ?? null, success_message: (data as any).success_message || null, success_links: successLinks };
      setForm(formData);
      // Set dynamic title & meta tags untuk preview link (WhatsApp/medsos)
      try {
        document.title = `${formData.title} — FormGua`;
        const desc = formData.description || `Isi form "${formData.title}" di FormGua.`;
        const setMeta = (selector: string, attr: string, content: string) => {
          let el = document.head.querySelector<HTMLMetaElement>(selector);
          if (!el) {
            el = document.createElement("meta");
            const [k, v] = attr.split("=");
            el.setAttribute(k, v.replace(/"/g, ""));
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
        };
        setMeta('meta[name="description"]', 'name="description"', desc);
        setMeta('meta[property="og:title"]', 'property="og:title"', `${formData.title} — FormGua`);
        setMeta('meta[property="og:description"]', 'property="og:description"', desc);
        setMeta('meta[property="og:url"]', 'property="og:url"', window.location.href);
        setMeta('meta[name="twitter:title"]', 'name="twitter:title"', `${formData.title} — FormGua`);
        setMeta('meta[name="twitter:description"]', 'name="twitter:description"', desc);
        const shareImage = formData.og_image_url || formData.banner_url;
        if (shareImage) {
          setMeta('meta[property="og:image"]', 'property="og:image"', shareImage);
          setMeta('meta[name="twitter:image"]', 'name="twitter:image"', shareImage);
        }
      } catch {}
      if (formData.form_type === "ujian" && formData.quiz_time_limit && formData.quiz_time_limit > 0) {
        setTimeLeft(formData.quiz_time_limit * 60);
      }
      setLoading(false);
    });
  }, [idOrSlug]);

  // Countdown timer untuk kuis
  useEffect(() => {
    if (timeLeft === null || submitted || timeUp) return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      setShowTimeWarning(false);
      submittedRef.current = true;
      submitRef.current?.().catch(() => {});
      return;
    }
    if (timeLeft === 30) setShowTimeWarning(true);
    const t = setTimeout(() => setTimeLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted, timeUp]);

  // Anti-cheat detection (khusus kuis/ujian)
  useEffect(() => {
    if (!form || form.form_type !== "ujian" || submitted) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        recordCheat("tab_hidden", "Terdeteksi berpindah tab atau meminimalkan halaman. Aktivitas ini dicatat.");
      }
    };
    const onBlur = () => recordCheat("window_blur", "Jendela kuis kehilangan fokus. Aktivitas ini dicatat.");
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); recordCheat("copy_attempt", "Menyalin teks tidak diizinkan pada kuis ini."); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); recordCheat("cut_attempt", "Memotong teks tidak diizinkan."); };
    const onContext = (e: MouseEvent) => { e.preventDefault(); recordCheat("contextmenu", "Klik kanan dinonaktifkan pada kuis."); };
    const onKey = (e: KeyboardEvent) => {
      // PrintScreen — kebanyakan browser tidak bisa benar-benar mencegah, tapi bisa dicatat
      if (e.key === "PrintScreen") {
        try { navigator.clipboard.writeText(""); } catch {}
        recordCheat("print_screen", "Terdeteksi tombol PrintScreen. Aktivitas ini dicatat.");
      }
      // Ctrl/Cmd + C / X / P / S
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "p", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        recordCheat("shortcut_blocked", "Pintasan keyboard ini dinonaktifkan pada kuis.");
      }
    };
    const onFsChange = () => {
      // Jika sebelumnya fullscreen lalu keluar
      if (!document.fullscreenElement) {
        // hanya catat jika user pernah berinteraksi (hindari false positive saat load)
        if (cheatEventsRef.current.length > 0 || document.hasFocus() === false) return;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [form, submitted]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
  if (!form || form.fields.length === 0) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p>Form tidak ditemukan atau belum memiliki pertanyaan</p>
      </motion.div>
    </div>
  );

  const { fields: allFields, theme } = form;
  const c = colorVars[theme.accentColor] || colorVars.indigo;

  // Gate nama peserta untuk form kuis (Quizizz-style)
  if (form.form_type === "ujian" && !nameSubmitted && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className={`absolute top-0 left-0 right-0 h-1 ${c.bg} opacity-70`} />
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!participantName.trim()) { popup.error("Nama wajib diisi"); return; }
            setNameSubmitted(true);
          }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <div className="text-center">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${c.light} mb-3`}>
              <Trophy className={`h-6 w-6 ${c.text}`} />
            </div>
            <h1 className="text-xl font-bold">{form.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">Masukkan nama kamu untuk muncul di leaderboard.</p>
          </div>
          <div>
            <Label className="text-xs">Nama Kamu</Label>
            <Input
              autoFocus
              maxLength={60}
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="mt-1.5 h-11 text-base"
            />
          </div>
          <Button type="submit" className={`w-full h-11 ${c.bg} hover:opacity-90 text-white`}>
            Mulai Kuis <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.form>
      </div>
    );
  }


  // Filter fields berdasarkan conditional logic.
  const visibleFields = allFields.filter((f) => {
    if (!f.conditional) return true;
    const parentAnswer = answers[f.conditional.parentId];
    if (!parentAnswer) return false;
    return parentAnswer.split(",").map((v) => v.trim()).includes(f.conditional.showIfValue);
  });

  const fields = visibleFields;
  const safeStep = Math.min(step, Math.max(fields.length - 1, 0));
  const currentField = fields[safeStep];
  const totalSteps = fields.length;
  const progress = totalSteps > 0 ? ((safeStep + 1) / totalSteps) * 100 : 0;

  if (!currentField) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground p-6 text-center">
        <p>Tidak ada pertanyaan untuk ditampilkan saat ini.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentField.required && !answers[currentField.id]?.trim()) {
      popup.error("Field ini wajib diisi");
      return;
    }
    if (safeStep < totalSteps - 1) setStep(safeStep + 1);
  };

  const handlePrev = () => { if (safeStep > 0) setStep(safeStep - 1); };

  const computeExamResult = (cleanedAnswers: Record<string, string>): ExamResult => {
    const details: ExamResult["details"] = [];
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const normalize = (s: string, ci: boolean) => {
      const trimmed = (s || "").trim().replace(/\s+/g, " ");
      return ci ? trimmed.toLowerCase() : trimmed;
    };

    // Levenshtein distance (untuk toleransi salah huruf pada soal isian/esai)
    const levenshtein = (a: string, b: string): number => {
      if (a === b) return 0;
      if (!a.length) return b.length;
      if (!b.length) return a.length;
      const m = a.length, n = b.length;
      let prev = new Array(n + 1);
      let curr = new Array(n + 1);
      for (let j = 0; j <= n; j++) prev[j] = j;
      for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
          const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
          curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
      }
      return prev[n];
    };

    visibleFields.forEach((f) => {
      // Pilihan ganda A–E
      if (f.type === "exam_mc") {
        const correct = (f.answer_key || "").trim();
        const userAnswer = (cleanedAnswers[f.id] || "").trim();
        const pCorrect = f.points_correct ?? 10;
        const pWrong = f.points_wrong ?? 0;
        maxScore += pCorrect;
        const isCorrect = !!correct && userAnswer === correct;
        const points = isCorrect ? pCorrect : pWrong;
        score += points;
        if (isCorrect) correctCount++;
        else wrongCount++;
        const letterToText = (letter: string) => {
          if (!letter) return "";
          const idx = letter.charCodeAt(0) - 65;
          return f.options?.[idx] ?? "";
        };
        details.push({
          fieldId: f.id,
          label: f.label,
          userAnswer,
          userAnswerText: letterToText(userAnswer),
          correctAnswer: correct,
          correctAnswerText: letterToText(correct),
          isCorrect,
          points,
          maxPoints: pCorrect,
          explanation: f.explanation,
        });
        return;
      }

      // Soal isian (text / textarea) — hanya dinilai otomatis jika ada answer_key_text
      if ((f.type === "text" || f.type === "textarea") && f.answer_key_text?.trim()) {
        const ci = f.answer_case_insensitive ?? true;
        const correctRaw = f.answer_key_text.trim();
        const userRaw = (cleanedAnswers[f.id] || "").trim();
        const pCorrect = f.points_correct ?? 10;
        const pWrong = f.points_wrong ?? 0;
        maxScore += pCorrect;
        const isCorrect = (() => {
          if (userRaw.length === 0) return false;
          const u = normalize(userRaw, ci);
          const c = normalize(correctRaw, ci);
          if (u === c) return true;
          const tol = Math.max(0, f.answer_fuzzy_tolerance ?? 0);
          if (tol > 0) return levenshtein(u, c) <= tol;
          return false;
        })();
        const points = isCorrect ? pCorrect : pWrong;
        score += points;
        if (isCorrect) correctCount++;
        else wrongCount++;
        details.push({
          fieldId: f.id,
          label: f.label,
          userAnswer: userRaw,
          userAnswerText: userRaw,
          correctAnswer: correctRaw,
          correctAnswerText: correctRaw,
          isCorrect,
          points,
          maxPoints: pCorrect,
          explanation: f.explanation,
        });
        return;
      }
      // Kalau text/textarea tanpa kunci → tidak dimasukkan ke skor (manual grading).
    });
    return { score, maxScore, correctCount, wrongCount, details };
  };

  const submitInternal = async (skipValidation: boolean) => {
    if (submittedRef.current && !skipValidation) return;
    if (!skipValidation && currentField.required && !answers[currentField.id]?.trim()) {
      popup.error("Field ini wajib diisi");
      return;
    }
    // Hapus jawaban dari field yang ter-skip karena conditional logic
    const visibleIds = new Set(visibleFields.map((f) => f.id));
    const cleanedAnswers: Record<string, string> = {};
    Object.entries(answers).forEach(([k, v]) => { if (visibleIds.has(k)) cleanedAnswers[k] = v; });

    let extraPayload: Record<string, any> = {};
    let result: ExamResult | null = null;
    if (form.form_type === "ujian") {
      result = computeExamResult(cleanedAnswers);
      extraPayload = {
        score: result.score,
        max_score: result.maxScore,
        correct_count: result.correctCount,
        wrong_count: result.wrongCount,
      };
    }

    const dataPayload: Record<string, any> = { ...cleanedAnswers };
    if (form.form_type === "ujian" && cheatEventsRef.current.length > 0) {
      dataPayload.__cheat_events = cheatEventsRef.current;
    }
    const insertPayload: Record<string, any> = { form_id: form.id, data: dataPayload, completed: true, ...extraPayload };
    if (form.form_type === "ujian" && participantName.trim()) insertPayload.participant_name = participantName.trim().slice(0, 60);
    const { data: inserted, error } = await supabase.from("form_responses").insert(insertPayload as any).select().single();
    if (error) { popup.error("Gagal mengirim"); return; }
    setResponseId(inserted?.id || null);
    if (result) setExamResult(result);
    setSubmitted(true);
    submittedRef.current = true;

    const labeledData: Record<string, string> = {};
    visibleFields.forEach(f => { if (cleanedAnswers[f.id]) labeledData[f.label] = cleanedAnswers[f.id]; });
    const cheats = cheatEventsRef.current;
    supabase.functions.invoke("notify-form-response", {
      body: {
        formId: form.id,
        formTitle: form.title,
        responseData: labeledData,
        cheatEvents: form.form_type === "ujian" ? cheats : undefined,
      },
    }).catch(() => {});
  };

  const handleSubmit = () => submitInternal(false);
  // Update ref agar timer auto-submit pakai versi terbaru
  submitRef.current = () => submitInternal(true);

  const setAnswer = (val: string) => setAnswers((prev) => ({ ...prev, [currentField.id]: val }));

  const btnClass = getButtonClass(theme.buttonStyle, theme.accentColor);
  const btnOutlineClass = getButtonOutlineClass(theme.buttonStyle, theme.accentColor);

  const handleGiveawaySubmit = async () => {
    if (!giveawayPhone.trim() || !giveawayEwallet) {
      popup.error("Isi nomor dan pilih e-wallet");
      return;
    }
    const { error } = await supabase.from("giveaway_entries").insert({
      form_id: form.id,
      response_id: responseId,
      phone: giveawayPhone.trim(),
      ewallet: giveawayEwallet,
    } as any);
    if (error) { popup.error("Gagal mendaftar giveaway"); return; }
    setGiveawaySubmitted(true);
    popup.success("Berhasil mendaftar giveaway!");
  };

  const ewalletLabels: Record<string, string> = { dana: "DANA", ovo: "OVO", gopay: "GoPay" };

  const downloadExamPdf = () => {
    if (!form || !examResult) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxW = pageW - margin * 2;
    let y = margin;
    const ensure = (h: number) => {
      if (y + h > pageH - margin) { doc.addPage(); y = margin; }
    };
    const writeText = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {}) => {
      const size = opts.size ?? 11;
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...(opts.color ?? [30, 30, 30]));
      const indent = opts.indent ?? 0;
      const lines = doc.splitTextToSize(text || "", maxW - indent);
      for (const line of lines) {
        ensure(size + 4);
        doc.text(line, margin + indent, y);
        y += size + 4;
      }
    };
    // Header
    doc.setFillColor(26, 115, 232);
    doc.rect(0, 0, pageW, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Hasil Kuis / Ujian", margin, 38);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleString("id-ID"), pageW - margin, 38, { align: "right" });
    y = 80;
    writeText(form.title, { size: 14, bold: true });
    y += 4;
    const pct = examResult.maxScore > 0 ? Math.round((examResult.score / examResult.maxScore) * 100) : 0;
    writeText(`Skor: ${examResult.score} / ${examResult.maxScore} (${pct}%)  |  Benar: ${examResult.correctCount}  |  Salah: ${examResult.wrongCount}`, { size: 11, bold: true, color: [26, 115, 232] });
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    examResult.details.forEach((d, i) => {
      ensure(60);
      writeText(`${i + 1}. ${d.label}`, { size: 12, bold: true });
      const yourAns = d.userAnswer ? `${d.userAnswer}${d.userAnswerText ? `. ${d.userAnswerText}` : ""}` : "-";
      writeText(`Jawaban kamu: ${yourAns}`, { size: 10, color: d.isCorrect ? [22, 163, 74] : [220, 38, 38], indent: 12 });
      if (!d.isCorrect) {
        const correct = `${d.correctAnswer}${d.correctAnswerText ? `. ${d.correctAnswerText}` : ""}`;
        writeText(`Jawaban benar: ${correct}`, { size: 10, color: [22, 163, 74], indent: 12 });
      }
      writeText(`Poin: ${d.points} / ${d.maxPoints}  ·  ${d.isCorrect ? "BENAR" : "SALAH"}`, { size: 9, color: [100, 100, 100], indent: 12 });
      if (d.explanation?.trim()) {
        writeText(`Pembahasan: ${d.explanation}`, { size: 10, color: [55, 55, 55], indent: 12 });
      }
      y += 8;
      ensure(2);
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 10;
    });

    // Footer on last page
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    ensure(20);
    doc.text("Dihasilkan oleh FormGua · Untuk pembelajaran", pageW / 2, pageH - 20, { align: "center" });

    const safe = (form.title || "hasil-ujian").replace(/[^\w\d-_ ]+/g, "").trim().replace(/\s+/g, "_");
    doc.save(`hasil_${safe}_${Date.now()}.pdf`);
  };

  if (submitted) {
    const isExam = form.form_type === "ujian" && examResult;
    const percent = isExam && examResult!.maxScore > 0 ? Math.round((examResult!.score / examResult!.maxScore) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
        {/* Subtle accent bar (lebih ringan dari blur blobs) */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${c.bg} opacity-70`} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-center max-w-md w-full relative z-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 12 }}
            className={`mx-auto mb-6 h-24 w-24 rounded-full ${c.light} flex items-center justify-center`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {isExam ? <Trophy className={`h-12 w-12 ${c.text}`} /> : <CheckCircle2 className={`h-12 w-12 ${c.text}`} />}
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-3xl font-bold mb-2">{isExam ? "Kuis Selesai!" : "Terima Kasih!"}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {form.success_message?.trim()
                ? form.success_message
                : (isExam ? "Berikut hasil kuis kamu" : "Respons kamu telah berhasil dikirim.")}
            </p>
          </motion.div>

          {form.success_links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-5 flex flex-col gap-2 items-stretch"
            >
              {form.success_links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 ${c.border} ${c.light} px-4 py-2.5 text-sm font-semibold ${c.text} hover:opacity-90 transition-all`}
                >
                  <ExternalLink className="h-4 w-4" />
                  {link.label}
                </a>
              ))}
            </motion.div>
          )}


          {/* Skor Ujian */}
          {isExam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 space-y-4"
            >
              <div className={`rounded-2xl border-2 ${c.border} p-6 ${c.light}`}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Skor Kamu</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-extrabold ${c.text}`}>{examResult!.score}</span>
                  <span className="text-xl text-muted-foreground">/ {examResult!.maxScore}</span>
                </div>
                <p className={`text-sm font-semibold mt-1 ${c.text}`}>{percent}%</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Benar</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{examResult!.correctCount}</p>
                </div>
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Salah</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{examResult!.wrongCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowExamDetails((v) => !v)}
                  className={`text-xs font-medium py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors`}
                >
                  {showExamDetails ? "Sembunyikan Detail" : "Lihat Detail Jawaban"}
                </button>
                <button
                  onClick={downloadExamPdf}
                  className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg text-white ${c.bg} hover:opacity-90 transition-opacity shadow-sm`}
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>
              {showExamDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 text-left max-h-80 overflow-y-auto rounded-xl border border-border p-3 bg-card"
                >
                  {examResult!.details.map((d, i) => (
                    <div key={d.fieldId} className={`rounded-lg border p-2.5 ${d.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                      <div className="flex items-start gap-2">
                        {d.isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium">{i + 1}. {d.label}</p>
                            <span className="shrink-0 text-[10px] font-semibold rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                              {d.points}/{d.maxPoints} poin
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Jawaban kamu:{" "}
                            <span className={d.isCorrect ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                              {d.userAnswer ? `${d.userAnswer}${d.userAnswerText ? `. ${d.userAnswerText}` : ""}` : "-"}
                            </span>
                            {!d.isCorrect && (
                              <> · Benar: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{d.correctAnswer}{d.correctAnswerText ? `. ${d.correctAnswerText}` : ""}</span></>
                            )}
                          </p>
                          {!d.isCorrect && d.explanation?.trim() && (
                            <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">💡 Pembahasan</p>
                              <p className="text-[11px] text-foreground/90 whitespace-pre-wrap">{d.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {isExam && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-6 text-left">
              <QuizLeaderboard formId={form.id} currentResponseId={responseId} accentBg={c.bg} accentText={c.text} />
            </motion.div>
          )}

          {!isExam && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex justify-center"
            >
              <CheckCircle2 className={`h-5 w-5 ${c.text} animate-pulse`} />
            </motion.div>
          )}
        </motion.div>

        {/* Giveaway Section — UI dipercantik */}
        {form.giveaway_enabled && form.giveaway_ewallets.length > 0 && !giveawaySubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8 w-full max-w-sm relative z-10"
          >
            <div className={`relative rounded-2xl border-2 ${c.border} p-5 sm:p-6 ${c.light} backdrop-blur-sm overflow-hidden shadow-xl`}>
              {/* Decorative blobs */}
              <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full ${c.bg} opacity-20 blur-2xl pointer-events-none`} />
              <div className={`absolute -bottom-12 -left-12 h-32 w-32 rounded-full ${c.bg} opacity-15 blur-2xl pointer-events-none`} />

              {/* Ribbon header */}
              <div className="relative flex flex-col items-center mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, delay: 1.1 }}
                  className={`h-12 w-12 rounded-2xl ${c.bg} flex items-center justify-center shadow-lg mb-2`}
                >
                  <Gift className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="font-extrabold text-base tracking-tight">🎉 Giveaway Saldo E-Wallet</h3>
                <p className="text-[11px] text-muted-foreground text-center mt-1 leading-relaxed">
                  Daftarkan nomor HP & e-wallet kamu untuk berkesempatan menang!
                </p>
              </div>

              <div className="space-y-3 relative">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Nomor HP</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={giveawayPhone}
                      onChange={(e) => setGiveawayPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="pl-10 h-11 bg-background/70"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Pilih E-Wallet</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {form.giveaway_ewallets.map((ew) => {
                      const active = giveawayEwallet === ew;
                      return (
                        <button
                          key={ew}
                          onClick={() => setGiveawayEwallet(ew)}
                          className={`relative py-2.5 rounded-xl text-xs font-bold border-2 transition-all overflow-hidden ${
                            active
                              ? `${c.border} ${c.text} ring-2 ${c.ring} scale-[1.03] shadow-md`
                              : "border-border text-muted-foreground hover:border-primary/40 bg-background/60"
                          }`}
                        >
                          {active && (
                            <motion.div
                              layoutId="ew-active"
                              className={`absolute inset-0 ${c.light} -z-10`}
                              transition={{ type: "spring", damping: 20 }}
                            />
                          )}
                          {ewalletLabels[ew] || ew}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleGiveawaySubmit}
                  disabled={!giveawayPhone.trim() || !giveawayEwallet}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] ${btnClass}`}
                >
                  <Gift className="h-4 w-4" />
                  Ikut Giveaway Sekarang
                </button>

                <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed pt-1">
                  ✨ Pemenang akan diumumkan oleh pembuat form
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {giveawaySubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 relative z-10 w-full max-w-sm"
          >
            <div className={`rounded-2xl border-2 ${c.border} ${c.light} p-5 text-center backdrop-blur-sm shadow-lg`}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className={`h-12 w-12 rounded-full ${c.bg} flex items-center justify-center mx-auto mb-2 shadow-md`}
              >
                <CheckCircle2 className="h-6 w-6 text-white" />
              </motion.div>
              <p className={`text-sm font-bold ${c.text}`}>Yeay, kamu sudah terdaftar!</p>
              <p className="text-[11px] text-muted-foreground mt-1">Tunggu pengumuman pemenang ya 🤞</p>
            </div>
          </motion.div>
        )}

        <footer className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} FormGua by rickthor7</span>
        </footer>
      </div>
    );
  }

  // ===== Renderer per-field (dipakai oleh layout scroll) =====
  const renderFieldInput = (field: FormField) => {
    const setFieldAnswer = (val: string) => setAnswers((prev) => ({ ...prev, [field.id]: val }));
    if (field.type === "text") {
      return <Input value={answers[field.id] || ""} onChange={(e) => setFieldAnswer(e.target.value)} placeholder={`Masukkan ${field.label.toLowerCase()}`} className={`h-11 text-base focus:ring-2 ${c.ring}`} />;
    }
    if (field.type === "email") {
      return <Input type="email" value={answers[field.id] || ""} onChange={(e) => setFieldAnswer(e.target.value)} placeholder="email@contoh.com" className={`h-11 text-base focus:ring-2 ${c.ring}`} />;
    }
    if (field.type === "textarea") {
      return <Textarea value={answers[field.id] || ""} onChange={(e) => setFieldAnswer(e.target.value)} placeholder="Tulis jawaban di sini..." rows={4} className={`text-base resize-none focus:ring-2 ${c.ring}`} />;
    }
    if (field.type === "number") {
      return <Input type="number" value={answers[field.id] || ""} onChange={(e) => setFieldAnswer(e.target.value)} placeholder="0" className={`h-11 text-base focus:ring-2 ${c.ring}`} />;
    }
    if (field.type === "date") {
      return <Input type="date" value={answers[field.id] || ""} onChange={(e) => setFieldAnswer(e.target.value)} className={`h-11 text-base focus:ring-2 ${c.ring}`} />;
    }
    if (field.type === "yesno") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {["Ya", "Tidak"].map((opt) => (
            <button key={opt} type="button" onClick={() => setFieldAnswer(opt)} className={`py-4 rounded-xl border-2 text-base font-bold transition-all ${answers[field.id] === opt ? `${c.border} ${c.bg} text-white ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}>
              {opt}
            </button>
          ))}
        </div>
      );
    }
    if (field.type === "radio" && field.options) {
      return (
        <div className="grid gap-2">
          {field.options.map((opt) => (
            <button key={opt} type="button" onClick={() => setFieldAnswer(opt)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${answers[field.id] === opt ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}>
              <span className="flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${answers[field.id] === opt ? `${c.border} ${c.bg}` : "border-muted-foreground/30"}`}>
                  {answers[field.id] === opt && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {opt}
              </span>
            </button>
          ))}
        </div>
      );
    }
    if (field.type === "exam_mc" && field.options) {
      return (
        <div className="space-y-2">
          {field.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const selected = answers[field.id] === letter;
            return (
              <button key={letter} type="button" onClick={() => setFieldAnswer(letter)} className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${selected ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}>
                <span className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold ${selected ? `${c.bg} text-white` : "bg-muted text-foreground"}`}>{letter}</span>
                <span className="flex-1">{opt || <span className="italic text-muted-foreground">(opsi {letter} kosong)</span>}</span>
              </button>
            );
          })}
        </div>
      );
    }
    if (field.type === "likert" && field.options) {
      const labels = ["Sangat Tidak Setuju", "Tidak Setuju", "Netral", "Setuju", "Sangat Setuju"];
      const isVertical = field.likertOrientation === "vertical";
      if (isVertical) {
        return (
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFieldAnswer(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${answers[field.id] === opt ? `${c.border} ${c.bg} text-white ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}
              >
                <span className="text-base font-bold w-6 text-left">{opt}</span>
                <span className={answers[field.id] === opt ? "text-white/95" : "text-muted-foreground"}>{labels[i] ?? ""}</span>
              </button>
            ))}
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2">
            {field.options.map((opt) => (
              <button key={opt} type="button" onClick={() => setFieldAnswer(opt)} className={`aspect-square flex items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${answers[field.id] === opt ? `${c.border} ${c.bg} text-white ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}>
                {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>1 = Sangat Tidak Setuju</span>
            <span>5 = Sangat Setuju</span>
          </div>
        </div>
      );
    }
    if (field.type === "checkbox" && field.options) {
      const selected = (answers[field.id] || "").split(",").filter(Boolean);
      return (
        <div className="grid gap-2">
          {field.options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => {
                const next = isChecked ? selected.filter((s) => s !== opt) : [...selected, opt];
                setFieldAnswer(next.join(","));
              }} className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isChecked ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}` : "border-border hover:border-primary/30"}`}>
                <span className="flex items-center gap-3">
                  <span className={`h-4 w-4 rounded-sm border-2 flex items-center justify-center ${isChecked ? `${c.border} ${c.bg}` : "border-muted-foreground/30"}`}>
                    {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      );
    }
    if (field.type === "file") {
      const parsed = parseFileAnswer(answers[field.id] || "");
      const uploading = uploadingFields[field.id];
      return (
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${parsed.url ? `${c.border} ${c.light}` : "border-border hover:border-primary/30"}`}>
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mengupload...</span>
            </div>
          ) : parsed.url ? (
            <div className="flex flex-col items-center gap-2">
              {isImageUrl(parsed.url) ? (
                <img src={parsed.url} alt={parsed.name} className="h-20 w-20 object-cover rounded-md border border-border" />
              ) : (
                <FileText className={`h-7 w-7 ${c.text}`} />
              )}
              <span className={`text-sm ${c.text} max-w-[200px] truncate`}>{parsed.name}</span>
              <span className="text-xs text-muted-foreground">Klik untuk ganti file</span>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Klik untuk upload file</span>
            </>
          )}
          <input type="file" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(field.id, e.target.files?.[0])} />
        </label>
      );
    }
    return null;
  };

  const handleScrollSubmit = async () => {
    // Validasi semua required visible fields
    for (const f of visibleFields) {
      if (f.required && !answers[f.id]?.trim()) {
        popup.error(`"${f.label}" wajib diisi`);
        return;
      }
    }
    await handleSubmit();
  };

  // Helper format MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const showTimer = form.form_type === "ujian" && timeLeft !== null && !submitted;
  const isCritical = timeLeft !== null && timeLeft <= 30;

  // Map accent color → tailwind classes for timer (normal state mengikuti tema)
  const timerThemeMap: Record<string, string> = {
    indigo: "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    cyan: "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amber: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    violet: "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    teal: "border-teal-500/50 bg-teal-500/10 text-teal-600 dark:text-teal-400",
    pink: "border-pink-500/50 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    orange: "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    slate: "border-slate-500/50 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  };
  const timerThemeCls = timerThemeMap[theme.accentColor] || timerThemeMap.indigo;

  const timerOverlay = (
    <>
      {showTimer && (
        <div
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full border-2 backdrop-blur-md shadow-lg font-mono font-bold text-sm transition-colors ${
            isCritical
              ? "border-rose-500/60 bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse"
              : timerThemeCls
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft!)}
        </div>
      )}

      {showTimeWarning && !timeUp && !submitted && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          onClick={() => setShowTimeWarning(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border-2 border-rose-500/50 bg-card p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-base">Waktu Hampir Habis!</h3>
                <p className="text-xs text-muted-foreground">Tersisa {timeLeft} detik</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Jawaban kamu akan dikirim otomatis saat waktu habis.
            </p>
            <Button onClick={() => setShowTimeWarning(false)} className="w-full">
              Mengerti, Lanjutkan
            </Button>
          </div>
        </div>
      )}

      {showCheatWarning && !submitted && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowCheatWarning(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border-2 border-amber-500/60 bg-card p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-base">Peringatan Kuis</h3>
                <p className="text-xs text-muted-foreground">Pelanggaran ke-{cheatEvents.length}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{showCheatWarning}</p>
            <p className="text-xs text-muted-foreground mb-4 italic">
              Catatan: Semua aktivitas mencurigakan akan dikirim ke pemilik kuis.
            </p>
            <Button onClick={() => setShowCheatWarning(null)} className="w-full">
              Saya Mengerti
            </Button>
          </div>
        </div>
      )}
    </>
  );

  const isQuiz = form.form_type === "ujian";
  const quizGuardClass = isQuiz ? "select-none [&_*]:!select-none" : "";

  // ===== LAYOUT: SCROLL (Google Form style) =====
  if (form.layout_mode === "scroll") {
    return (
      <div className={`min-h-screen relative ${quizGuardClass}`}>
        {timerOverlay}
        {/* Garis aksen tipis di atas (pengganti blur blobs yang berat) */}
        <div className={`fixed top-0 left-0 right-0 h-0.5 ${c.bg} opacity-60 z-10`} />

        <header className="flex items-center justify-between px-4 md:px-8 py-4 relative z-10">
          <span className="text-sm font-bold text-gradient">FormGua</span>
          <ThemeToggle />
        </header>

        <main className="max-w-2xl mx-auto px-4 md:px-8 pb-12 relative z-10">
          {form.banner_url && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden mb-4 aspect-[4/1] bg-muted"
            >
              <img src={form.banner_url} alt="Banner form" className={`w-full h-full ${theme.bannerFit === "contain" ? "object-contain" : "object-cover"}`} />
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`border-l-4 ${c.border} pl-4 mb-6`}>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{form.title}</h1>
            {form.description && <p className="text-muted-foreground">{form.description}</p>}
          </motion.div>

          <div className="space-y-3">
            {visibleFields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm"
              >
                <Label className="text-base font-semibold block mb-3">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                  {isQuiz && (field.type === "exam_mc" || ((field.type === "text" || field.type === "textarea") && field.answer_key_text?.trim())) && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 align-middle">
                      {field.points_correct ?? 10} poin
                    </span>
                  )}
                </Label>
                {field.image_url && (
                  <img
                    src={field.image_url}
                    alt={`Gambar soal ${idx + 1}`}
                    loading="lazy"
                    className="mb-3 max-h-72 w-auto rounded-lg border border-border object-contain bg-muted/30"
                    draggable={false}
                  />
                )}
                {renderFieldInput(field)}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleScrollSubmit}
              className={`${btnClass} flex items-center gap-1.5 px-8 py-3 text-sm font-semibold transition-shadow shadow-md hover:shadow-lg active:scale-[0.98]`}
            >
              Kirim
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </main>

        <footer className="py-4 relative z-10 text-center">
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} FormGua by rickthor7</span>
        </footer>
      </div>
    );
  }

  // ===== LAYOUT: PAGINATED (default, modern slide) =====
  return (
    <div className={`min-h-screen flex flex-col relative ${quizGuardClass}`}>
      {timerOverlay}
      {/* Garis aksen tipis (pengganti blur blobs) */}
      <div className={`fixed top-0 left-0 right-0 h-0.5 ${c.bg} opacity-60 z-10`} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 relative z-10">
        <span className="text-sm font-bold text-gradient">FormGua</span>
        <ThemeToggle />
      </header>

      {/* Progress */}
      <div className="px-4 md:px-8 mb-2 relative z-10">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${c.gradient}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Langkah {safeStep + 1} dari {totalSteps}</p>
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 relative z-10">
        <div className="w-full max-w-lg">
          {/* Title (first step only) */}
          {safeStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              {form.banner_url && (
                <div className="rounded-2xl overflow-hidden mb-5 aspect-[4/1] bg-muted">
                  <img src={form.banner_url} alt="Banner form" className={`w-full h-full ${theme.bannerFit === "contain" ? "object-contain" : "object-cover"}`} />
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{form.title}</h1>
              {form.description && <p className="text-muted-foreground">{form.description}</p>}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-4"
            >
              <div>
                <Label className="text-lg font-semibold">
                  {currentField.label}
                  {currentField.required && <span className="text-destructive ml-1">*</span>}
                  {isQuiz && (currentField.type === "exam_mc" || ((currentField.type === "text" || currentField.type === "textarea") && currentField.answer_key_text?.trim())) && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold px-2 py-0.5 align-middle">
                      {currentField.points_correct ?? 10} poin
                    </span>
                  )}
                </Label>
                {currentField.image_url && (
                  <img
                    src={currentField.image_url}
                    alt="Gambar soal"
                    loading="lazy"
                    className="mt-3 max-h-80 w-auto rounded-lg border border-border object-contain bg-muted/30"
                    draggable={false}
                  />
                )}
              </div>

              <div>
                {currentField.type === "text" && (
                  <Input
                    value={answers[currentField.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={`Masukkan ${currentField.label.toLowerCase()}`}
                    className={`h-12 text-base transition-all duration-300 focus:ring-2 ${c.ring} focus:${c.border}`}
                    onKeyDown={(e) => e.key === "Enter" && (safeStep < totalSteps - 1 ? handleNext() : handleSubmit())}
                  />
                )}

                {currentField.type === "email" && (
                  <Input
                    type="email"
                    value={answers[currentField.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="email@contoh.com"
                    className={`h-12 text-base transition-all duration-300 focus:ring-2 ${c.ring}`}
                    onKeyDown={(e) => e.key === "Enter" && (safeStep < totalSteps - 1 ? handleNext() : handleSubmit())}
                  />
                )}

                {currentField.type === "textarea" && (
                  <Textarea
                    value={answers[currentField.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Tulis jawaban di sini..."
                    rows={4}
                    className={`text-base resize-none transition-all duration-300 focus:ring-2 ${c.ring}`}
                  />
                )}

                {currentField.type === "number" && (
                  <Input
                    type="number"
                    value={answers[currentField.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="0"
                    className={`h-12 text-base transition-all duration-300 focus:ring-2 ${c.ring}`}
                    onKeyDown={(e) => e.key === "Enter" && (safeStep < totalSteps - 1 ? handleNext() : handleSubmit())}
                  />
                )}

                {currentField.type === "date" && (
                  <Input
                    type="date"
                    value={answers[currentField.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    className={`h-12 text-base transition-all duration-300 focus:ring-2 ${c.ring}`}
                    onKeyDown={(e) => e.key === "Enter" && (safeStep < totalSteps - 1 ? handleNext() : handleSubmit())}
                  />
                )}

                {currentField.type === "yesno" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      {["Ya", "Tidak"].map((opt, i) => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(opt)}
                          className={`py-5 rounded-2xl border-2 text-base font-bold transition-all duration-300 ${
                            answers[currentField.id] === opt
                              ? `${c.border} ${c.bg} text-white ring-2 ${c.ring} shadow-lg`
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {!currentField.required && answers[currentField.id] && (
                      <button
                        onClick={() => setAnswers((prev) => { const n = { ...prev }; delete n[currentField.id]; return n; })}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕ Bersihkan pilihan
                      </button>
                    )}
                  </div>
                )}

                {currentField.type === "exam_mc" && currentField.options && (
                  <div className="space-y-2">
                    {currentField.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const selected = answers[currentField.id] === letter;
                      return (
                        <button
                          key={letter}
                          onClick={() => setAnswer(letter)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                            selected
                              ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}`
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          <span className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-base font-bold transition-all ${
                            selected ? `${c.bg} text-white` : "bg-muted text-foreground"
                          }`}>
                            {letter}
                          </span>
                          <span className="flex-1 text-left">{opt || <span className="italic text-muted-foreground">(opsi {letter} kosong)</span>}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentField.type === "radio" && currentField.options && (
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      {currentField.options.map((opt, i) => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(opt)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                            answers[currentField.id] === opt
                              ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}`
                              : "border-border hover:border-primary/30 hover:bg-muted/50 hover:translate-x-1"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              answers[currentField.id] === opt ? `${c.border} ${c.bg}` : "border-muted-foreground/30"
                            }`}>
                              {answers[currentField.id] === opt && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            {opt}
                          </span>
                        </button>
                      ))}
                    </div>
                    {!currentField.required && answers[currentField.id] && (
                      <button
                        onClick={() => setAnswers((prev) => { const n = { ...prev }; delete n[currentField.id]; return n; })}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕ Bersihkan pilihan
                      </button>
                    )}
                  </div>
                )}

                {currentField.type === "likert" && currentField.options && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                      {currentField.options.map((opt, i) => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(opt)}
                          className={`aspect-square flex items-center justify-center rounded-xl border-2 text-lg font-bold transition-all duration-300 ${
                            answers[currentField.id] === opt
                              ? `${c.border} ${c.bg} text-white ring-2 ${c.ring} scale-105`
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground px-1">
                      <span>1 = Sangat Tidak Setuju</span>
                      <span>5 = Sangat Setuju</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">2 = Tidak Setuju · 3 = Netral · 4 = Setuju</p>
                    {!currentField.required && answers[currentField.id] && (
                      <button
                        onClick={() => setAnswers((prev) => { const n = { ...prev }; delete n[currentField.id]; return n; })}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕ Bersihkan pilihan
                      </button>
                    )}
                  </div>
                )}

                {currentField.type === "checkbox" && currentField.options && (
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      {currentField.options.map((opt, i) => {
                        const selected = (answers[currentField.id] || "").split(",").filter(Boolean);
                        const isChecked = selected.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              const newSelected = isChecked ? selected.filter(s => s !== opt) : [...selected, opt];
                              setAnswer(newSelected.join(","));
                            }}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                              isChecked
                                ? `${c.border} ${c.light} ${c.text} ring-2 ${c.ring}`
                                : "border-border hover:border-primary/30 hover:bg-muted/50 hover:translate-x-1"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-all ${
                                isChecked ? `${c.border} ${c.bg}` : "border-muted-foreground/30"
                              }`}>
                                {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </span>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!currentField.required && answers[currentField.id] && (
                      <button
                        onClick={() => setAnswers((prev) => { const n = { ...prev }; delete n[currentField.id]; return n; })}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕ Bersihkan pilihan
                      </button>
                    )}
                  </div>
                )}

                {currentField.type === "file" && (() => {
                  const parsed = parseFileAnswer(answers[currentField.id] || "");
                  const uploading = uploadingFields[currentField.id];
                  return (
                    <label
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 ${
                        parsed.url ? `${c.border} ${c.light}` : "border-border hover:border-primary/30 hover:bg-muted/30"
                      } ${uploading ? "opacity-70 cursor-wait" : ""}`}
                    >
                      {uploading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Mengupload file...</span>
                        </div>
                      ) : parsed.url ? (
                        <div className="flex flex-col items-center gap-2">
                          {isImageUrl(parsed.url) ? (
                            <img src={parsed.url} alt={parsed.name} className="h-24 w-24 object-cover rounded-md border border-border" />
                          ) : (
                            <FileText className={`h-8 w-8 ${c.text}`} />
                          )}
                          <span className={`text-sm ${c.text} max-w-[240px] truncate`}>{parsed.name}</span>
                          <span className="text-xs text-muted-foreground">Klik untuk ganti file</span>
                        </div>
                      ) : (
                        <>
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          </motion.div>
                          <span className="text-sm text-muted-foreground">Klik untuk upload file</span>
                          <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (maks. 10MB)</span>
                        </>
                      )}
                      <input type="file" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(currentField.id, e.target.files?.[0])} />
                    </label>
                  );
                })()}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={safeStep === 0}
              className={`flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                safeStep === 0 ? "" : "hover:bg-muted"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </button>
            {safeStep < totalSteps - 1 ? (
              <button
                onClick={handleNext}
                className={`${btnClass} flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                Lanjut
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`${btnClass} flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                Kirim
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 relative z-10 text-center">
        <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} FormGua by rickthor7</span>
      </footer>
    </div>
  );
}

function getButtonClass(style: string, color: string): string {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500 text-white",
    cyan: "bg-cyan-500 text-white",
    emerald: "bg-emerald-500 text-white",
    rose: "bg-rose-500 text-white",
    amber: "bg-amber-500 text-white",
    violet: "bg-violet-500 text-white",
    teal: "bg-teal-500 text-white",
    pink: "bg-pink-500 text-white",
    orange: "bg-orange-500 text-white",
    slate: "bg-slate-700 text-white",
  };
  const gradientMap: Record<string, string> = {
    indigo: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
    cyan: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    rose: "bg-gradient-to-r from-rose-500 to-pink-500 text-white",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    violet: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
    teal: "bg-gradient-to-r from-teal-400 to-emerald-500 text-white",
    pink: "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white",
    orange: "bg-gradient-to-r from-orange-400 to-red-500 text-white",
    slate: "bg-gradient-to-r from-slate-700 to-slate-900 text-white",
  };
  const outlineMap: Record<string, string> = {
    indigo: "border-2 border-indigo-500 text-indigo-500",
    cyan: "border-2 border-cyan-500 text-cyan-500",
    emerald: "border-2 border-emerald-500 text-emerald-500",
    rose: "border-2 border-rose-500 text-rose-500",
    amber: "border-2 border-amber-500 text-amber-500",
    violet: "border-2 border-violet-500 text-violet-500",
    teal: "border-2 border-teal-500 text-teal-500",
    pink: "border-2 border-pink-500 text-pink-500",
    orange: "border-2 border-orange-500 text-orange-500",
    slate: "border-2 border-slate-700 text-slate-700",
  };
  const softMap: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30",
    cyan: "bg-cyan-500/15 text-cyan-600 border border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-600 border border-rose-500/30",
    amber: "bg-amber-500/15 text-amber-700 border border-amber-500/30",
    violet: "bg-violet-500/15 text-violet-600 border border-violet-500/30",
    teal: "bg-teal-500/15 text-teal-600 border border-teal-500/30",
    pink: "bg-pink-500/15 text-pink-600 border border-pink-500/30",
    orange: "bg-orange-500/15 text-orange-600 border border-orange-500/30",
    slate: "bg-slate-500/15 text-slate-700 border border-slate-500/30",
  };
  const glowShadowMap: Record<string, string> = {
    indigo: "shadow-[0_0_18px_rgba(99,102,241,0.55)]",
    cyan: "shadow-[0_0_18px_rgba(6,182,212,0.55)]",
    emerald: "shadow-[0_0_18px_rgba(16,185,129,0.55)]",
    rose: "shadow-[0_0_18px_rgba(244,63,94,0.55)]",
    amber: "shadow-[0_0_18px_rgba(245,158,11,0.55)]",
    violet: "shadow-[0_0_18px_rgba(139,92,246,0.55)]",
    teal: "shadow-[0_0_18px_rgba(20,184,166,0.55)]",
    pink: "shadow-[0_0_18px_rgba(236,72,153,0.55)]",
    orange: "shadow-[0_0_18px_rgba(249,115,22,0.55)]",
    slate: "shadow-[0_0_18px_rgba(51,65,85,0.55)]",
  };
  const radiusMap: Record<string, string> = {
    default: "rounded-md",
    rounded: "rounded-lg",
    pill: "rounded-full",
    outline: "rounded-md",
    gradient: "rounded-lg",
    glow: "rounded-lg",
    soft: "rounded-xl",
  };

  let cls = radiusMap[style] || "rounded-md";
  if (style === "outline") cls += " " + (outlineMap[color] || outlineMap.indigo);
  else if (style === "gradient") cls += " " + (gradientMap[color] || gradientMap.indigo);
  else if (style === "soft") cls += " " + (softMap[color] || softMap.indigo);
  else if (style === "glow") cls += " " + (colorMap[color] || colorMap.indigo) + " " + (glowShadowMap[color] || glowShadowMap.indigo);
  else cls += " " + (colorMap[color] || colorMap.indigo);
  return cls;
}

function getButtonOutlineClass(style: string, color: string): string {
  return getButtonClass("outline", color).replace("rounded-md", style === "pill" ? "rounded-full" : style === "rounded" ? "rounded-lg" : "rounded-md");
}
