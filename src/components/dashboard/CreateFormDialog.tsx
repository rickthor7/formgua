import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff, Gift, Mail, Shuffle, Equal, Layers, ScrollText, FileText, Users, GraduationCap, ShieldCheck, Wand2, Loader2, Lock, Crown, Infinity as InfinityIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { FormType } from "./SelectFormTypeDialog";

const FREE_AI_LIMIT = 3;

interface CreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formType: FormType;
  onSubmit: (data: {
    title: string;
    description: string;
    password: string;
    giveaway_enabled: boolean;
    giveaway_ewallets: string[];
    giveaway_mode: "equal" | "random";
    giveaway_total_amount: number;
    giveaway_winner_count: number;
    notify_enabled: boolean;
    notify_email: string;
    layout_mode: "paginated" | "scroll";
    form_type: FormType;
    ai_prompt: string;
  }) => void;
}

const FORM_TYPE_META: Record<FormType, { title: string; icon: typeof FileText; label: string; placeholder: string }> = {
  bebas: { title: "Buat Form Bebas", icon: FileText, label: "Form Bebas", placeholder: "Contoh: Survey Kepuasan" },
  responden: { title: "Buat Form Responden", icon: Users, label: "Form Responden (Skala Likert)", placeholder: "Contoh: Kuesioner Penelitian" },
  ujian: { title: "Buat Form Kuis", icon: GraduationCap, label: "Form Kuis (Pilihan Ganda)", placeholder: "Contoh: Kuis Matematika BAB 1" },
};

const ewalletOptions = [
  { id: "dana", label: "DANA", color: "text-blue-500" },
  { id: "ovo", label: "OVO", color: "text-purple-500" },
  { id: "gopay", label: "GoPay", color: "text-green-500" },
];

export function CreateFormDialog({ open, onOpenChange, formType, onSubmit }: CreateFormDialogProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const meta = FORM_TYPE_META[formType];
  const TypeIcon = meta.icon;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [giveawayEnabled, setGiveawayEnabled] = useState(false);
  const [selectedEwallets, setSelectedEwallets] = useState<string[]>([]);
  const [giveawayMode, setGiveawayMode] = useState<"equal" | "random">("equal");
  const [giveawayTotalAmount, setGiveawayTotalAmount] = useState<string>("");
  const [giveawayWinnerCount, setGiveawayWinnerCount] = useState<string>("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [layoutMode, setLayoutMode] = useState<"paginated" | "scroll">("paginated");
  const [aiPrompt, setAiPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiUsed, setAiUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("ai_usage_count").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setAiUsed(prof?.ai_usage_count ?? 0);
      const r = (roles ?? []).map((x: any) => x.role);
      setIsPremium(r.includes("admin") || r.includes("premium"));
    })();
  }, [open, user]);

  const aiQuotaExhausted = !isPremium && aiUsed >= FREE_AI_LIMIT;

  const totalAmountNum = parseInt(giveawayTotalAmount) || 0;
  const winnerCountNum = parseInt(giveawayWinnerCount) || 0;
  const perWinnerAmount = giveawayMode === "equal" && winnerCountNum > 0 ? Math.floor(totalAmountNum / winnerCountNum) : 0;
  const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim()) return;
    if (!isLoggedIn && !password.trim()) return;
    if (giveawayEnabled) {
      if (selectedEwallets.length === 0) return;
      if (totalAmountNum <= 0) return;
      if (winnerCountNum <= 0) return;
    }
    if (notifyEnabled && !notifyEmail.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        password: isLoggedIn ? "" : password.trim(),
        giveaway_enabled: giveawayEnabled,
        giveaway_ewallets: giveawayEnabled ? selectedEwallets : [],
        giveaway_mode: giveawayMode,
        giveaway_total_amount: giveawayEnabled ? totalAmountNum : 0,
        giveaway_winner_count: giveawayEnabled ? winnerCountNum : 1,
        notify_enabled: notifyEnabled,
        notify_email: notifyEnabled ? notifyEmail.trim() : "",
        layout_mode: layoutMode,
        form_type: formType,
        ai_prompt: aiPrompt.trim(),
      } as any);
      setTitle("");
      setDescription("");
      setPassword("");
      setGiveawayEnabled(false);
      setSelectedEwallets([]);
      setGiveawayMode("equal");
      setGiveawayTotalAmount("");
      setGiveawayWinnerCount("");
      setNotifyEnabled(false);
      setNotifyEmail("");
      setLayoutMode("paginated");
      setAiPrompt("");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEwallet = (id: string) => {
    setSelectedEwallets((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-primary" />
            {meta.title}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">{meta.label}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Form</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={meta.placeholder} className="focus:glow-ring" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Deskripsi (opsional)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat..." rows={3} className="focus:glow-ring resize-none" />
          </div>

          {/* AI Generate */}
          <div className="space-y-2 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label htmlFor="ai-prompt" className="flex items-center gap-1.5 text-sm">
                <Wand2 className="h-4 w-4 text-primary" />
                Generate dengan AI <span className="text-[10px] font-normal text-muted-foreground">(opsional)</span>
              </Label>
              {isLoggedIn && (
                isPremium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold">
                    <Crown className="h-3 w-3" /> Premium · <InfinityIcon className="h-3 w-3" /> Unlimited
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${aiQuotaExhausted ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                    Sisa {Math.max(FREE_AI_LIMIT - aiUsed, 0)}/{FREE_AI_LIMIT}
                  </span>
                )
              )}
            </div>

            {!isLoggedIn ? (
              <div className="rounded-md border border-dashed border-primary/40 bg-background/50 p-3 flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-medium">Login dulu untuk pakai AI</p>
                  <p className="text-[10px] text-muted-foreground">Fitur generate AI hanya untuk user terdaftar. Gratis 3x, premium unlimited.</p>
                  <Button asChild size="sm" variant="default" className="h-7 text-[11px]">
                    <Link to="/auth">Masuk / Daftar</Link>
                  </Button>
                </div>
              </div>
            ) : aiQuotaExhausted ? (
              <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2">
                <Crown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-medium">Kuota AI gratis ({FREE_AI_LIMIT}x) sudah habis</p>
                  <p className="text-[10px] text-muted-foreground">Upgrade ke Premium untuk pemakaian AI tanpa batas.</p>
                  <Button asChild size="sm" variant="default" className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600">
                    <Link to="/dashboard?upgrade=1">Upgrade Premium</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground">
                  Tulis detail/topik form. Saat klik "Buat Form", AI otomatis isi pertanyaannya — bisa diedit setelahnya.
                </p>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={
                    formType === "ujian"
                      ? "Contoh: Kuis 10 soal tentang sistem pencernaan manusia kelas 8 SMP"
                      : formType === "responden"
                      ? "Contoh: Kuesioner kepuasan pelanggan layanan kafe, 8 pernyataan"
                      : "Contoh: Form pendaftaran lomba desain grafis: nama, asal kampus, link portfolio"
                  }
                  rows={3}
                  className="focus:glow-ring resize-none bg-background"
                />
              </>
            )}
          </div>

          {isLoggedIn ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium">Form pribadi (terkunci ke akunmu)</p>
                <p className="text-[10px] text-muted-foreground">Kamu login, jadi tidak perlu set password manual. Hanya kamu yang bisa edit form ini.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">Password Dashboard</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password untuk akses dashboard"
                  className="focus:glow-ring pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Digunakan untuk mengakses builder & respons form ini</p>
            </div>
          )}

          {/* Layout / Tampilan Form */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label className="text-sm">Model Tampilan Form</Label>
            <p className="text-[10px] text-muted-foreground">Pilih bagaimana pertanyaan ditampilkan ke responden</p>
            <RadioGroup value={layoutMode} onValueChange={(v) => setLayoutMode(v as "paginated" | "scroll")} className="grid grid-cols-1 gap-2 pt-1">
              <label htmlFor="layout-paginated" className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${layoutMode === "paginated" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="paginated" id="layout-paginated" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Per Halaman (Modern)
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Satu pertanyaan per halaman, di-slide saat lanjut</p>
                </div>
              </label>
              <label htmlFor="layout-scroll" className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${layoutMode === "scroll" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="scroll" id="layout-scroll" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <ScrollText className="h-3.5 w-3.5 text-primary" />
                    Scroll Penuh (Google Form)
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Semua pertanyaan tampil dalam satu halaman panjang</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Giveaway Section */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="giveaway"
                checked={giveawayEnabled}
                onCheckedChange={(checked) => setGiveawayEnabled(checked === true)}
              />
              <Label htmlFor="giveaway" className="flex items-center gap-1.5 cursor-pointer text-sm">
                <Gift className="h-4 w-4 text-primary" />
                Aktifkan Giveaway Saldo E-Wallet
              </Label>
            </div>
            {giveawayEnabled && (
              <div className="space-y-3 pl-6">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Pilih e-wallet yang tersedia:</p>
                  <div className="flex flex-wrap gap-2">
                    {ewalletOptions.map((ew) => (
                      <button
                        key={ew.id}
                        type="button"
                        onClick={() => toggleEwallet(ew.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedEwallets.includes(ew.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {ew.label}
                      </button>
                    ))}
                  </div>
                  {selectedEwallets.length === 0 && (
                    <p className="text-[10px] text-destructive">Pilih minimal 1 e-wallet</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Mode pembagian hadiah:</p>
                  <RadioGroup value={giveawayMode} onValueChange={(v) => setGiveawayMode(v as "equal" | "random")} className="grid grid-cols-1 gap-2">
                    <label htmlFor="mode-equal" className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${giveawayMode === "equal" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="equal" id="mode-equal" className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Equal className="h-3.5 w-3.5 text-primary" />
                          Bagi Rata
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tiap pemenang dapat nominal yang sama</p>
                      </div>
                    </label>
                    <label htmlFor="mode-random" className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-all ${giveawayMode === "random" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="random" id="mode-random" className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Shuffle className="h-3.5 w-3.5 text-primary" />
                          Nominal Acak
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tiap pemenang dapat nominal acak (total tetap sesuai input)</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="total-amount" className="text-xs">Total Nominal (Rp)</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      min="0"
                      value={giveawayTotalAmount}
                      onChange={(e) => setGiveawayTotalAmount(e.target.value)}
                      placeholder="50000"
                      className="focus:glow-ring h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="winner-count" className="text-xs">Jumlah Pemenang</Label>
                    <Input
                      id="winner-count"
                      type="number"
                      min="1"
                      value={giveawayWinnerCount}
                      onChange={(e) => setGiveawayWinnerCount(e.target.value)}
                      placeholder="5"
                      className="focus:glow-ring h-9 text-xs"
                    />
                  </div>
                </div>

                {totalAmountNum > 0 && winnerCountNum > 0 && (
                  <div className="rounded-md bg-muted/50 p-2 text-[10px] space-y-0.5">
                    <p>Total: <span className="font-semibold text-foreground">{formatRupiah(totalAmountNum)}</span> untuk <span className="font-semibold text-foreground">{winnerCountNum} pemenang</span></p>
                    {giveawayMode === "equal" ? (
                      <p>→ Per pemenang: <span className="font-semibold text-primary">{formatRupiah(perWinnerAmount)}</span></p>
                    ) : (
                      <p>→ Tiap pemenang dapat <span className="font-semibold text-primary">nominal acak</span></p>
                    )}
                  </div>
                )}

                {(totalAmountNum <= 0 || winnerCountNum <= 0) && (
                  <p className="text-[10px] text-destructive">Isi total nominal & jumlah pemenang</p>
                )}
              </div>
            )}
          </div>

          {/* Email Notification Section */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="notify"
                checked={notifyEnabled}
                onCheckedChange={(checked) => setNotifyEnabled(checked === true)}
              />
              <Label htmlFor="notify" className="flex items-center gap-1.5 cursor-pointer text-sm">
                <Mail className="h-4 w-4 text-primary" />
                Aktifkan Notifikasi Email
              </Label>
            </div>
            {notifyEnabled && (
              <div className="space-y-2 pl-6">
                <p className="text-xs text-muted-foreground">Terima notifikasi email setiap ada respons baru:</p>
                <Input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="focus:glow-ring"
                />
                {notifyEnabled && !notifyEmail.trim() && (
                  <p className="text-[10px] text-destructive">Masukkan alamat email</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || (!isLoggedIn && !password.trim()) || (giveawayEnabled && (selectedEwallets.length === 0 || totalAmountNum <= 0 || winnerCountNum <= 0)) || (notifyEnabled && !notifyEmail.trim())}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {aiPrompt.trim() ? "Generating AI..." : "Membuat..."}
                </>
              ) : (
                <>
                  {aiPrompt.trim() && <Wand2 className="h-4 w-4 mr-1.5" />}
                  Buat Form
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
