import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PasswordGate } from "@/components/PasswordGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { popup } from "@/lib/swal";
import { Plus, Trash2, GripVertical, ArrowLeft, Save, Eye, X, Palette, Layers, ScrollText, Image as ImageIcon, Loader2, Upload, FileText, Users, GraduationCap, Key, ArrowUp, ArrowDown, CheckCircle2, Link2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuizShareCard } from "@/components/QuizShareCard";


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
  // Khusus form kuis (exam_mc)
  answer_key?: string;
  points_correct?: number;
  points_wrong?: number;
  // Khusus kuis tipe teks (text/textarea): kunci jawaban teks utk auto-grading.
  // Jika kosong → tidak dinilai otomatis (manual oleh author).
  answer_key_text?: string;
  // Cocokkan jawaban tanpa hiraukan huruf besar/kecil & spasi (default: true)
  answer_case_insensitive?: boolean;
  // Toleransi salah huruf (Levenshtein distance). 0 = harus persis. Default 0.
  answer_fuzzy_tolerance?: number;
  // Khusus likert: orientasi tampilan ("horizontal" default | "vertical")
  likertOrientation?: "horizontal" | "vertical";
  // Gambar pendukung soal (opsional, untuk soal bergambar)
  image_url?: string;
  // Pembahasan/penjelasan soal (ditampilkan setelah selesai, terutama jika jawaban salah)
  explanation?: string;
}

interface FormTheme {
  buttonStyle: "default" | "rounded" | "pill" | "outline" | "gradient" | "glow" | "soft";
  accentColor: string;
  bannerFit?: "cover" | "contain";
}

type FormType = "bebas" | "responden" | "ujian";

const LIKERT_OPTIONS = ["1", "2", "3", "4", "5"];
const LIKERT_LEGEND = "1 = Sangat Tidak Setuju · 2 = Tidak Setuju · 3 = Netral · 4 = Setuju · 5 = Sangat Setuju";
const YESNO_OPTIONS = ["Ya", "Tidak"];
const EXAM_OPTIONS = ["A", "B", "C", "D", "E"];
const EXAM_DEFAULT_TEXTS = ["", "", "", "", ""];

const fieldTypesBebas = [
  { value: "text", label: "Teks Pendek" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Teks Panjang" },
  { value: "yesno", label: "Ya / Tidak" },
  { value: "radio", label: "Pilihan Ganda" },
  { value: "checkbox", label: "Kotak Centang" },
  { value: "likert", label: "Variabel 1 - 5" },
  { value: "number", label: "Angka" },
  { value: "date", label: "Tanggal" },
  { value: "file", label: "Upload File" },
];

const fieldTypesUjian = [
  { value: "exam_mc", label: "Pilihan Ganda (A-E)" },
  { value: "text", label: "Teks Pendek (isian)" },
  { value: "textarea", label: "Teks Panjang (esai)" },
];

const FORM_TYPE_BADGE: Record<FormType, { label: string; icon: typeof FileText; cls: string }> = {
  bebas: { label: "Form Bebas", icon: FileText, cls: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  responden: { label: "Form Responden", icon: Users, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  ujian: { label: "Form Kuis", icon: GraduationCap, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
};

const buttonStyles = [
  { value: "default", label: "Solid", preview: "rounded-md" },
  { value: "rounded", label: "Rounded", preview: "rounded-lg" },
  { value: "pill", label: "Pill", preview: "rounded-full" },
  { value: "outline", label: "Outline", preview: "rounded-md border-2 bg-transparent" },
  { value: "gradient", label: "Gradient", preview: "rounded-lg bg-gradient-to-r" },
  { value: "glow", label: "Glow", preview: "rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.6)]" },
  { value: "soft", label: "Soft", preview: "rounded-xl bg-opacity-20" },
];

const accentColors = [
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "slate", label: "Slate", class: "bg-slate-700" },
];

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [status, setStatus] = useState("draft");
  const [theme, setTheme] = useState<FormTheme>({ buttonStyle: "default", accentColor: "indigo" });
  const [layoutMode, setLayoutMode] = useState<"paginated" | "scroll">("paginated");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTheme, setShowTheme] = useState(false);
  const [formType, setFormType] = useState<FormType>("bebas");
  const [quizTimeLimit, setQuizTimeLimit] = useState<number | "">("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [successLinks, setSuccessLinks] = useState<Array<{ label: string; url: string }>>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  const [formPassword, setFormPassword] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("forms").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) { popup.error("Form tidak ditemukan"); navigate("/dashboard"); return; }
      setFormTitle(data.title);
      setJoinCode((data as any).join_code || null);
      setSlug((data as any).slug || null);
      setFormPassword((data as any).password || null);
      
      // If no password set, auto-unlock
      if (!(data as any).password) {
        setUnlocked(true);
      }
      
      setTitle(data.title);
      setDescription(data.description || "");
      setFields((Array.isArray(data.fields) ? data.fields : []) as unknown as FormField[]);
      setStatus(data.status);
      setLayoutMode(((data as any).layout_mode === "scroll" ? "scroll" : "paginated"));
      setBannerUrl((data as any).banner_url || null);
      
      const ft = ((data as any).form_type || "bebas") as FormType;
      setFormType(ft);
      const tl = (data as any).quiz_time_limit;
      setQuizTimeLimit(typeof tl === "number" && tl > 0 ? tl : "");
      setSuccessMessage((data as any).success_message || "");
      const sl = (data as any).success_links;
      setSuccessLinks(Array.isArray(sl) ? sl.filter((x: any) => x && typeof x === "object").map((x: any) => ({ label: String(x.label || ""), url: String(x.url || "") })) : []);
      const raw = data.fields as any;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && raw._theme) {
        setTheme(raw._theme);
        setFields(raw.fields || []);
      }
      setLoading(false);
    });
  }, [id]);

  const addField = () => {
    if (formType === "ujian") {
      setFields([...fields, {
        id: crypto.randomUUID(),
        type: "exam_mc",
        label: "",
        required: true,
        options: [...EXAM_DEFAULT_TEXTS],
        answer_key: "",
        points_correct: 10,
        points_wrong: 0,
      }]);
      return;
    }
    if (formType === "responden") {
      setFields([...fields, {
        id: crypto.randomUUID(),
        type: "likert",
        label: "",
        required: false,
        options: [...LIKERT_OPTIONS],
      }]);
      return;
    }
    setFields([...fields, {
      id: crypto.randomUUID(),
      type: "text",
      label: "",
      required: false,
    }]);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const moveField = (fieldId: string, direction: -1 | 1) => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === fieldId);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      return arrayMove(prev, idx, newIdx);
    });
  };

  const addOption = (fieldId: string) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f;
      return { ...f, options: [...(f.options || []), ""] };
    }));
  };

  const updateOption = (fieldId: string, idx: number, value: string) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f;
      const opts = [...(f.options || [])];
      opts[idx] = value;
      return { ...f, options: opts };
    }));
  };

  const removeOption = (fieldId: string, idx: number) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f;
      const opts = [...(f.options || [])];
      opts.splice(idx, 1);
      return { ...f, options: opts };
    }));
  };

  const handleBannerUpload = async (file: File | undefined) => {
    if (!file || !id) return;
    if (!file.type.startsWith("image/")) {
      popup.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      popup.error("Ukuran banner maksimal 5MB");
      return;
    }
    setUploadingBanner(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${id}/banner_${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("form-uploads").upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("form-uploads").getPublicUrl(path);
      setBannerUrl(data.publicUrl);
      popup.success("Banner berhasil diupload");
    } catch (err: any) {
      popup.error(err?.message || "Gagal upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };



  const handleSave = async () => {
    if (!title.trim()) { popup.error("Judul form wajib diisi"); return; }
    if (fields.length === 0) { popup.error("Tambahkan minimal 1 field"); return; }
    const emptyLabel = fields.find(f => !f.label.trim());
    if (emptyLabel) { popup.error("Semua field harus punya label"); return; }
    if (formType === "ujian") {
      const noKey = fields.find((f) => f.type === "exam_mc" && !f.answer_key);
      if (noKey) { popup.error("Setiap soal kuis harus punya kunci jawaban"); return; }
    }

    setSaving(true);
    // Store theme alongside fields
    const payload = { fields, _theme: theme };
    const { error } = await supabase.from("forms").update({
      title: title.trim(),
      description: description.trim() || null,
      fields: payload as any,
      status,
      layout_mode: layoutMode,
      banner_url: bannerUrl,
      og_image_url: bannerUrl,
      quiz_time_limit: formType === "ujian" && typeof quizTimeLimit === "number" && quizTimeLimit > 0 ? quizTimeLimit : null,
      success_message: successMessage.trim() || null,
      success_links: successLinks.filter((l) => l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    } as any).eq("id", id!);

    setSaving(false);
    if (error) { popup.error("Gagal menyimpan"); return; }
    popup.success("Form berhasil disimpan!");
    navigate("/dashboard");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-2 sm:px-4 h-14 gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0 h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Kembali</span>
          </Button>
          <div className="flex items-center gap-1 sm:gap-2 flex-nowrap justify-end min-w-0">
            <ThemeToggle />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[72px] sm:w-28 h-8 text-xs px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draf</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setShowTheme(!showTheme)} className="h-8 w-8 sm:w-auto sm:px-3 sm:gap-1.5 shrink-0">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Tema</span>
            </Button>
            <Button variant="outline" size="icon" asChild className="h-8 w-8 sm:w-auto sm:px-3 shrink-0">
              <a href={`/form/${id}`} target="_blank" rel="noopener noreferrer" className="sm:gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Preview</span>
              </a>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-8 px-2.5 sm:px-3 shrink-0">
              <Save className="h-3.5 w-3.5" />
              <span className="text-xs">{saving ? "..." : "Simpan"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {formType === "ujian" && (
          <QuizShareCard joinCode={joinCode} formId={id!} slug={slug} />
        )}
        {/* Theme Dialog (modal) — tampil di atas halaman, bukan slide inline */}
        <Dialog open={showTheme} onOpenChange={setShowTheme}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" />
                Kustomisasi Tema
              </DialogTitle>
              <DialogDescription className="text-xs">
                Atur tampilan, banner, gaya tombol, dan warna form kamu.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-5">
              {/* Layout Mode */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Model Tampilan Form</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutMode("paginated")}
                    className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-all ${layoutMode === "paginated" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                  >
                    <Layers className={`h-4 w-4 mt-0.5 shrink-0 ${layoutMode === "paginated" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className={`text-xs font-semibold ${layoutMode === "paginated" ? "text-primary" : "text-foreground"}`}>Per Halaman</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Satu pertanyaan per slide</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("scroll")}
                    className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-all ${layoutMode === "scroll" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                  >
                    <ScrollText className={`h-4 w-4 mt-0.5 shrink-0 ${layoutMode === "scroll" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className={`text-xs font-semibold ${layoutMode === "scroll" ? "text-primary" : "text-foreground"}`}>Scroll Penuh</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Semua pertanyaan dalam 1 halaman</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Banner Header */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Banner Header Form
                </Label>
                {bannerUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-border aspect-[4/1] bg-muted">
                      <img src={bannerUrl} alt="Banner form" className={`w-full h-full ${theme.bannerFit === "contain" ? "object-contain" : "object-cover"}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme({ ...theme, bannerFit: "cover" })}
                        className={`text-[11px] font-medium py-2 rounded-lg border transition-all ${(theme.bannerFit ?? "cover") === "cover" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}
                      >
                        Pas/Crop (isi penuh)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme({ ...theme, bannerFit: "contain" })}
                        className={`text-[11px] font-medium py-2 rounded-lg border transition-all ${theme.bannerFit === "contain" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}
                      >
                        Paskan (tampil utuh)
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                          disabled={uploadingBanner}
                        />
                        <div className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors ${uploadingBanner ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Ganti Banner
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => setBannerUrl(null)}
                        className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                      disabled={uploadingBanner}
                    />
                    <div className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors ${uploadingBanner ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingBanner ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                      <div className="text-center">
                        <div className="text-xs font-medium">{uploadingBanner ? "Mengupload..." : "Klik untuk upload banner"}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                          Disarankan <span className="font-semibold text-foreground">1600 × 400 px</span> (rasio 4:1)<br/>
                          PNG, JPG, atau WEBP · Maks 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Button Style */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gaya Tombol</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {buttonStyles.map(bs => (
                    <button
                      key={bs.value}
                      onClick={() => setTheme({ ...theme, buttonStyle: bs.value as FormTheme["buttonStyle"] })}
                      className={`p-3 rounded-lg border text-xs font-medium text-center transition-all ${
                        theme.buttonStyle === bs.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className={`mx-auto mb-1.5 h-6 w-16 ${bs.preview} ${theme.buttonStyle === bs.value ? "bg-primary" : "bg-muted-foreground/20"}`} />
                      {bs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Warna Aksen</Label>
                <div className="flex flex-wrap gap-2">
                  {accentColors.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setTheme({ ...theme, accentColor: c.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        theme.accentColor === c.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full ${c.class}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-3 border-t border-border">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview Tombol</Label>
                <div className="flex gap-2 flex-wrap">
                  <ButtonPreview style={theme.buttonStyle} color={theme.accentColor} label="Lanjut" />
                  <ButtonPreview style={theme.buttonStyle} color={theme.accentColor} label="Kirim" />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/30 sticky bottom-0">
              <Button onClick={() => setShowTheme(false)} className="w-full" size="sm">
                Selesai
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Form Info */}
        <div className="space-y-4">
          {(() => {
            const badge = FORM_TYPE_BADGE[formType];
            const BadgeIcon = badge.icon;
            return (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${badge.cls}`}>
                <BadgeIcon className="h-3 w-3" />
                {badge.label}
              </div>
            );
          })()}
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Judul Form"
            className="text-xl sm:text-2xl font-bold border-0 border-b border-border rounded-none px-0 h-auto py-2 focus-visible:ring-0 focus:glow-ring bg-transparent"
          />
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Deskripsi form (opsional)"
            rows={2}
            className="border-0 border-b border-border rounded-none px-0 resize-none focus-visible:ring-0 focus:glow-ring bg-transparent"
          />
          {formType === "ujian" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4 space-y-2">
              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                ⏱️ Batas Waktu Kuis (menit)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={600}
                  value={quizTimeLimit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setQuizTimeLimit("");
                    const n = parseInt(v, 10);
                    setQuizTimeLimit(Number.isFinite(n) && n > 0 ? n : "");
                  }}
                  placeholder="Kosongkan jika tanpa batas"
                  className="h-9 max-w-[200px]"
                />
                {quizTimeLimit !== "" && (
                  <button
                    type="button"
                    onClick={() => setQuizTimeLimit("")}
                    className="text-[11px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Saat waktu hampir habis (10 detik), peserta akan diberi peringatan. Jawaban otomatis dikirim saat waktu habis.
              </p>
            </div>
          )}

          {/* Halaman Terima Kasih (setelah submit) */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Halaman Setelah Submit
                </Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Sesuaikan pesan & tambahkan tombol link yang muncul setelah responden mengirim form.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Pesan Terima Kasih (opsional)</Label>
              <Textarea
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                placeholder="Contoh: Terima kasih sudah mengisi! Jawaban kamu sangat berarti bagi kami."
                rows={2}
                className="resize-none text-sm bg-background"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{successMessage.length}/500</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Tombol Link (opsional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setSuccessLinks((prev) => [...prev, { label: "", url: "" }])}
                  disabled={successLinks.length >= 5}
                >
                  <Plus className="h-3 w-3 mr-1" /> Tambah Link
                </Button>
              </div>
              {successLinks.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Belum ada link. Klik "Tambah Link" untuk menambahkan tombol (mis. grup WhatsApp, Instagram, website).</p>
              )}
              {successLinks.map((link, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 rounded-lg border border-border bg-background p-2">
                  <Input
                    value={link.label}
                    onChange={(e) => setSuccessLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l))}
                    placeholder="Label tombol (mis. Gabung WhatsApp)"
                    className="h-8 text-xs sm:max-w-[220px]"
                    maxLength={40}
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => setSuccessLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))}
                    placeholder="https://..."
                    className="h-8 text-xs flex-1"
                    type="url"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setSuccessLinks((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {successLinks.length >= 5 && (
                <p className="text-[10px] text-muted-foreground">Maksimal 5 link.</p>
              )}
            </div>
          </div>
        </div>


        {/* Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {formType === "ujian" ? "Soal Kuis" : "Pertanyaan"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {formType === "ujian"
                ? `${fields.length} soal · Total skor maks: ${fields.reduce((s, f) => {
                    if (f.type === "exam_mc") return s + (f.points_correct ?? 0);
                    if ((f.type === "text" || f.type === "textarea") && f.answer_key_text?.trim()) return s + (f.points_correct ?? 0);
                    return s;
                  }, 0)}`
                : `${fields.length} field`}
            </span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  formId={id}
                  formType={formType}
                  fieldTypes={formType === "ujian" ? fieldTypesUjian : fieldTypesBebas}
                  previousFields={fields.slice(0, index)}
                  updateField={updateField}
                  removeField={removeField}
                  addOption={addOption}
                  updateOption={updateOption}
                  removeOption={removeOption}
                  moveField={moveField}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>

          <motion.button
            onClick={addField}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Pertanyaan
          </motion.button>
        </div>
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FormGua by{" "}
          <a
            href="https://instagram.com/rickthor7"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline transition-colors"
          >
            rickthor7
          </a>
        </div>
      </footer>
    </div>
  );
}

function ButtonPreview({ style, color, label }: { style: string; color: string; label: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500 text-white border-indigo-500",
    cyan: "bg-cyan-500 text-white border-cyan-500",
    emerald: "bg-emerald-500 text-white border-emerald-500",
    rose: "bg-rose-500 text-white border-rose-500",
    amber: "bg-amber-500 text-white border-amber-500",
    violet: "bg-violet-500 text-white border-violet-500",
    teal: "bg-teal-500 text-white border-teal-500",
    pink: "bg-pink-500 text-white border-pink-500",
    orange: "bg-orange-500 text-white border-orange-500",
    slate: "bg-slate-700 text-white border-slate-700",
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
    indigo: "border-2 border-indigo-500 text-indigo-500 bg-transparent",
    cyan: "border-2 border-cyan-500 text-cyan-500 bg-transparent",
    emerald: "border-2 border-emerald-500 text-emerald-500 bg-transparent",
    rose: "border-2 border-rose-500 text-rose-500 bg-transparent",
    amber: "border-2 border-amber-500 text-amber-500 bg-transparent",
    violet: "border-2 border-violet-500 text-violet-500 bg-transparent",
    teal: "border-2 border-teal-500 text-teal-500 bg-transparent",
    pink: "border-2 border-pink-500 text-pink-500 bg-transparent",
    orange: "border-2 border-orange-500 text-orange-500 bg-transparent",
    slate: "border-2 border-slate-700 text-slate-700 bg-transparent",
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

  let classes = `px-4 py-2 text-sm font-medium ${radiusMap[style] || "rounded-md"} transition-all `;
  if (style === "outline") {
    classes += outlineMap[color] || outlineMap.indigo;
  } else if (style === "gradient") {
    classes += gradientMap[color] || gradientMap.indigo;
  } else if (style === "soft") {
    classes += softMap[color] || softMap.indigo;
  } else if (style === "glow") {
    classes += `${colorMap[color] || colorMap.indigo} ${glowShadowMap[color] || glowShadowMap.indigo}`;
  } else {
    classes += colorMap[color] || colorMap.indigo;
  }

  return <div className={classes}>{label}</div>;
}

interface SortableFieldItemProps {
  field: FormField;
  index: number;
  formId: string | undefined;
  formType: FormType;
  fieldTypes: { value: string; label: string }[];
  previousFields: FormField[];
  updateField: (id: string, updates: Partial<FormField>) => void;
  removeField: (id: string) => void;
  addOption: (id: string) => void;
  updateOption: (id: string, idx: number, val: string) => void;
  removeOption: (id: string, idx: number) => void;
  moveField: (id: string, direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableFieldItem({ field, index, formId, formType, fieldTypes, previousFields, updateField, removeField, addOption, updateOption, removeOption, moveField, isFirst, isLast }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file || !formId) return;
    if (!file.type.startsWith("image/")) { popup.error("File harus berupa gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { popup.error("Ukuran gambar maksimal 5MB"); return; }
    setUploadingImg(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${formId}/q_${field.id}_${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("form-uploads").upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("form-uploads").getPublicUrl(path);
      updateField(field.id, { image_url: data.publicUrl });
      popup.success("Gambar soal berhasil diupload");
    } catch (err: any) {
      popup.error(err?.message || "Gagal upload gambar");
    } finally {
      setUploadingImg(false);
    }
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const eligibleParents = previousFields.filter(
    (f) => f.type === "yesno" || f.type === "radio" || f.type === "likert"
  );
  const parentField = field.conditional
    ? previousFields.find((f) => f.id === field.conditional!.parentId)
    : undefined;
  const parentOptions: string[] = parentField
    ? parentField.type === "yesno"
      ? YESNO_OPTIONS
      : parentField.type === "likert"
      ? LIKERT_OPTIONS
      : parentField.options || []
    : [];

  return (
    <div ref={setNodeRef} style={style} className="glass-card rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          <div
            {...attributes}
            {...listeners}
            aria-label="Geser untuk menyusun ulang"
            className="text-muted-foreground cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">{index + 1}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isFirst}
            onClick={() => moveField(field.id, -1)}
            aria-label="Naikkan"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isLast}
            onClick={() => moveField(field.id, 1)}
            aria-label="Turunkan"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="flex-1 w-full">
              <Label className="text-xs text-muted-foreground mb-1 block">Label Pertanyaan</Label>
              <Input
                value={field.label}
                onChange={e => updateField(field.id, { label: e.target.value })}
                placeholder={`Pertanyaan ${index + 1}`}
                className="focus:glow-ring"
              />
            </div>
            <div className="w-full sm:w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Tipe</Label>
              <Select value={field.type} onValueChange={val => {
                const updates: Partial<FormField> = {
                  type: val,
                  options: val === "likert"
                    ? LIKERT_OPTIONS
                    : val === "yesno"
                    ? YESNO_OPTIONS
                    : val === "exam_mc"
                    ? [...EXAM_DEFAULT_TEXTS]
                    : (val === "radio" || val === "checkbox")
                    ? (field.options?.length ? field.options : ["Opsi 1"])
                    : undefined,
                };
                // Saat berpindah tipe pada form Kuis, pastikan default poin & skema grading konsisten
                if (formType === "ujian") {
                  updates.points_correct = field.points_correct ?? 10;
                  updates.points_wrong = field.points_wrong ?? 0;
                  if (val !== "exam_mc") updates.answer_key = undefined;
                  if (val !== "text" && val !== "textarea") {
                    updates.answer_key_text = undefined;
                    updates.answer_case_insensitive = undefined;
                    updates.answer_fuzzy_tolerance = undefined;
                  } else if (field.answer_case_insensitive === undefined) {
                    updates.answer_case_insensitive = true;
                  }
                }
                updateField(field.id, updates);
              }}>
                <SelectTrigger className="focus:glow-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(ft => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gambar pendukung soal — khusus form Kuis */}
          {formType === "ujian" && (
            <div className="space-y-2 pl-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                Gambar Soal (opsional)
              </Label>
              {field.image_url ? (
                <div className="relative inline-block">
                  <img
                    src={field.image_url}
                    alt="Gambar soal"
                    className="max-h-40 w-auto rounded-lg border border-border object-contain bg-muted/30"
                  />
                  <button
                    type="button"
                    onClick={() => updateField(field.id, { image_url: undefined })}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:scale-110 transition-transform"
                    title="Hapus gambar"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer text-xs text-muted-foreground transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    disabled={uploadingImg}
                  />
                  {uploadingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingImg ? "Mengupload..." : "Upload Gambar Soal"}
                </label>
              )}
              <p className="text-[10px] text-muted-foreground">Maks 5MB. Gambar akan tampil di atas soal saat responden mengerjakan.</p>
            </div>
          )}

          {field.type === "yesno" && (
            <div className="space-y-2 pl-1">
              <Label className="text-xs text-muted-foreground">Pratinjau</Label>
              <div className="flex gap-2">
                {YESNO_OPTIONS.map((opt) => (
                  <div key={opt} className="flex-1 flex items-center justify-center h-10 rounded-lg border-2 border-muted-foreground/20 text-sm font-semibold text-muted-foreground">
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {field.type === "likert" && (
            <div className="space-y-2 pl-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs text-muted-foreground">Skala Likert (1-5)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Tampilan:</span>
                  <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateField(field.id, { likertOrientation: "horizontal" })}
                      className={`px-2 py-1 text-[10px] font-medium transition-colors ${(field.likertOrientation ?? "horizontal") === "horizontal" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                    >
                      Mendatar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField(field.id, { likertOrientation: "vertical" })}
                      className={`px-2 py-1 text-[10px] font-medium transition-colors ${field.likertOrientation === "vertical" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                    >
                      Menurun
                    </button>
                  </div>
                </div>
              </div>
              {(field.likertOrientation ?? "horizontal") === "horizontal" ? (
                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map((opt) => (
                    <div key={opt} className="flex-1 flex items-center justify-center h-10 rounded-lg border-2 border-muted-foreground/20 text-sm font-semibold text-muted-foreground">
                      {opt}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {LIKERT_OPTIONS.map((opt, i) => {
                    const labels = ["Sangat Tidak Setuju", "Tidak Setuju", "Netral", "Setuju", "Sangat Setuju"];
                    return (
                      <div key={opt} className="flex items-center gap-3 h-10 px-3 rounded-lg border-2 border-muted-foreground/20 text-sm text-muted-foreground">
                        <span className="font-bold w-5">{opt}</span>
                        <span className="text-xs">{labels[i]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">{LIKERT_LEGEND}</p>
            </div>
          )}

          {field.type === "exam_mc" && (
            <div className="space-y-3 pl-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Key className="h-3 w-3" />
                Pengaturan Soal Pilihan Ganda
              </Label>
              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground">Opsi Jawaban (A–E)</Label>
                {EXAM_OPTIONS.map((letter, optIdx) => {
                  const isAnswer = field.answer_key === letter;
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateField(field.id, { answer_key: letter })}
                        title={isAnswer ? "Kunci jawaban" : "Tandai sebagai kunci jawaban"}
                        className={`h-9 w-9 shrink-0 rounded-md text-xs font-bold transition-all ${
                          isAnswer
                            ? "bg-emerald-500 text-white shadow"
                            : "bg-background border border-border hover:border-emerald-500/40"
                        }`}
                      >
                        {letter}
                      </button>
                      <Input
                        value={field.options?.[optIdx] ?? ""}
                        onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                        placeholder={`Teks opsi ${letter}`}
                        className="h-9 text-sm"
                      />
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground">Klik huruf A–E untuk menandai sebagai kunci jawaban.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nilai jika Benar</Label>
                  <Input
                    type="number"
                    min="0"
                    value={field.points_correct ?? 10}
                    onChange={(e) => updateField(field.id, { points_correct: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nilai jika Salah</Label>
                  <Input
                    type="number"
                    value={field.points_wrong ?? 0}
                    onChange={(e) => updateField(field.id, { points_wrong: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              {!field.answer_key && (
                <p className="text-[10px] text-destructive">⚠ Pilih kunci jawaban untuk soal ini</p>
              )}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">💡 Pembahasan (opsional)</Label>
                <Textarea
                  value={field.explanation ?? ""}
                  onChange={(e) => updateField(field.id, { explanation: e.target.value })}
                  placeholder="Ditampilkan ke responden setelah kuis selesai jika jawabannya salah."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Pengaturan kuis untuk soal isian (text / textarea) */}
          {formType === "ujian" && (field.type === "text" || field.type === "textarea") && (
            <div className="space-y-3 pl-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Key className="h-3 w-3" />
                Pengaturan Soal {field.type === "text" ? "Isian Singkat" : "Esai"}
              </Label>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Kunci Jawaban (opsional)</Label>
                {field.type === "text" ? (
                  <Input
                    value={field.answer_key_text ?? ""}
                    onChange={(e) => updateField(field.id, { answer_key_text: e.target.value })}
                    placeholder="Kosongkan utk dinilai manual oleh author"
                    className="h-9 text-sm"
                  />
                ) : (
                  <Textarea
                    value={field.answer_key_text ?? ""}
                    onChange={(e) => updateField(field.id, { answer_key_text: e.target.value })}
                    placeholder="Kosongkan utk dinilai manual oleh author"
                    rows={2}
                    className="text-sm resize-none"
                  />
                )}
                <p className="text-[10px] text-muted-foreground">
                  {field.answer_key_text?.trim()
                    ? "Sistem akan cocokkan jawaban responden secara otomatis."
                    : "Tanpa kunci jawaban → soal ini tidak masuk skor otomatis (dinilai manual)."}
                </p>
              </div>
              {field.answer_key_text?.trim() && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.answer_case_insensitive ?? true}
                      onCheckedChange={(val) => updateField(field.id, { answer_case_insensitive: val })}
                    />
                    <span className="text-[11px] text-muted-foreground">Abaikan huruf besar/kecil & spasi berlebih</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Toleransi salah huruf</span>
                      <span className="font-mono text-[10px] text-foreground">
                        {(field.answer_fuzzy_tolerance ?? 0) === 0 ? "Persis" : `≤ ${field.answer_fuzzy_tolerance} huruf`}
                      </span>
                    </Label>
                    <Select
                      value={String(field.answer_fuzzy_tolerance ?? 0)}
                      onValueChange={(val) => updateField(field.id, { answer_fuzzy_tolerance: parseInt(val) || 0 })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Harus persis (0)</SelectItem>
                        <SelectItem value="1">Toleransi 1 huruf salah</SelectItem>
                        <SelectItem value="2">Toleransi 2 huruf salah</SelectItem>
                        <SelectItem value="3">Toleransi 3 huruf salah</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Berguna utk typo ringan. Mis. "Jakata" tetap dianggap benar utk "Jakarta" jika toleransi ≥ 1.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nilai jika Benar</Label>
                  <Input
                    type="number"
                    min="0"
                    value={field.points_correct ?? 10}
                    onChange={(e) => updateField(field.id, { points_correct: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nilai jika Salah</Label>
                  <Input
                    type="number"
                    value={field.points_wrong ?? 0}
                    onChange={(e) => updateField(field.id, { points_wrong: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm"
                    disabled={!field.answer_key_text?.trim()}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">💡 Pembahasan (opsional)</Label>
                <Textarea
                  value={field.explanation ?? ""}
                  onChange={(e) => updateField(field.id, { explanation: e.target.value })}
                  placeholder="Ditampilkan ke responden setelah kuis selesai jika jawabannya salah."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}

          {(field.type === "radio" || field.type === "checkbox") && (
            <div className="space-y-2 pl-1">
              <Label className="text-xs text-muted-foreground">Opsi Jawaban</Label>
              {(field.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-${field.type === "radio" ? "full" : "sm"} border-2 border-muted-foreground/30 shrink-0`} />
                  <Input
                    value={opt}
                    onChange={e => updateOption(field.id, optIdx, e.target.value)}
                    placeholder={`Opsi ${optIdx + 1}`}
                    className="h-8 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOption(field.id, optIdx)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addOption(field.id)} className="text-xs gap-1 text-primary">
                <Plus className="h-3 w-3" />
                Tambah Opsi
              </Button>
            </div>
          )}

          {eligibleParents.length > 0 && (
            <div className="space-y-2 pl-1 pt-2 border-t border-dashed border-border">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">🔀 Logika Bercabang (opsional)</Label>
                {field.conditional && (
                  <button
                    type="button"
                    onClick={() => updateField(field.id, { conditional: undefined })}
                    className="text-[10px] text-destructive hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Tampilkan pertanyaan ini hanya jika syarat terpenuhi</p>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={field.conditional?.parentId || "__none__"}
                  onValueChange={(val) => {
                    if (val === "__none__") {
                      updateField(field.id, { conditional: undefined });
                    } else {
                      const newParent = previousFields.find((f) => f.id === val);
                      const firstOpt = newParent?.type === "yesno"
                        ? YESNO_OPTIONS[0]
                        : newParent?.type === "likert"
                        ? "5"
                        : newParent?.options?.[0] || "";
                      updateField(field.id, { conditional: { parentId: val, showIfValue: firstOpt } });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pertanyaan acuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Tidak ada syarat —</SelectItem>
                    {eligibleParents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        #{previousFields.indexOf(p) + 1} {p.label || "Tanpa label"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.conditional && parentOptions.length > 0 && (
                  <Select
                    value={field.conditional.showIfValue}
                    onValueChange={(val) => updateField(field.id, { conditional: { ...field.conditional!, showIfValue: val } })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>= {opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Switch checked={field.required} onCheckedChange={val => updateField(field.id, { required: val })} />
              <span className="text-xs text-muted-foreground">Wajib diisi</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeField(field.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
