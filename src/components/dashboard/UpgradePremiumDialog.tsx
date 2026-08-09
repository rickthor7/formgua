import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Crown, Loader2, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { popup } from "@/lib/swal";

interface UpgradePremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRICING = [
  { months: 0, price: 5000, label: "1 Minggu" },
  { months: 1, price: 10000, label: "1 Bulan", badge: "Populer" },
  { months: 12, price: 25000, label: "1 Tahun", badge: "Hemat" },
];

const REK = { bank: "BCA", number: "1234567890", name: "FormGua Premium" };

export function UpgradePremiumDialog({ open, onOpenChange }: UpgradePremiumDialogProps) {
  const { user } = useAuth();
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  const selectedPrice = PRICING.find(p => p.months === duration)?.price ?? 10000;

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("premium_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingRequest(data);
    })();
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!proofFile) { popup.error("Upload bukti transfer dulu"); return; }
    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("premium_requests").insert({
        user_id: user.id,
        amount: selectedPrice,
        payment_method: paymentMethod,
        proof_url: path,
        duration_months: duration,
        notes: notes.trim() || null,
        status: "pending",
      });
      if (insErr) throw insErr;

      popup.success("Permintaan upgrade dikirim! Admin akan verifikasi maks 24 jam.");
      onOpenChange(false);
    } catch (err: any) {
      popup.error(err?.message || "Gagal mengirim permintaan");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (!existingRequest) return null;
    const map: Record<string, { icon: any; cls: string; title: string; desc: string }> = {
      pending: { icon: Clock, cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400", title: "Permintaan kamu sedang diproses", desc: "Admin akan verifikasi pembayaranmu maks 24 jam." },
      approved: { icon: CheckCircle2, cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", title: "Premium aktif!", desc: "Terima kasih, fitur AI unlimited sudah aktif untuk akunmu." },
      rejected: { icon: XCircle, cls: "border-destructive/40 bg-destructive/10 text-destructive", title: "Permintaan ditolak", desc: existingRequest.admin_note || "Hubungi admin untuk info lebih lanjut." },
    };
    const s = map[existingRequest.status] || map.pending;
    const Icon = s.icon;
    return (
      <div className={`rounded-lg border p-3 flex items-start gap-2 ${s.cls}`}>
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold">{s.title}</p>
          <p className="text-[11px] opacity-90">{s.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Upgrade ke Premium
          </DialogTitle>
          <DialogDescription>AI unlimited, prioritas dukungan, dan fitur eksklusif lainnya.</DialogDescription>
        </DialogHeader>

        {renderStatusBanner()}

        {existingRequest?.status !== "approved" && existingRequest?.status !== "pending" && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Pilih Durasi</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRICING.map((p) => (
                  <button
                    key={p.months}
                    type="button"
                    onClick={() => setDuration(p.months)}
                    className={`relative rounded-lg border p-3 text-center transition-all ${duration === p.months ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-amber-500/40"}`}
                  >
                    {p.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-amber-500 text-white px-1.5 rounded-full whitespace-nowrap">{p.badge}</span>}
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Rp {p.price.toLocaleString("id-ID")}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-1 text-xs">
              <p className="font-semibold">Transfer ke rekening:</p>
              <p>Bank <span className="font-mono">{REK.bank}</span></p>
              <p>No. Rek: <span className="font-mono font-semibold">{REK.number}</span></p>
              <p>a.n. {REK.name}</p>
              <p className="pt-1 text-muted-foreground">Nominal: <span className="font-bold text-foreground">Rp {selectedPrice.toLocaleString("id-ID")}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method" className="text-xs">Metode Pembayaran</Label>
              <Input id="method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Transfer Bank / DANA / OVO ..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proof" className="text-xs">Upload Bukti Transfer</Label>
              <Input id="proof" type="file" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              {proofFile && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" /> {proofFile.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Catatan (opsional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Misal: nomor wa, jam transfer..." className="resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600">
                {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Crown className="h-4 w-4 mr-1.5" />}
                Kirim Permintaan
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
