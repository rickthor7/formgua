import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Share2, RotateCcw, Smartphone, Wallet, Sparkles, Users, Coins, Crown } from "lucide-react";
import { popup } from "@/lib/swal";

interface GiveawayEntry {
  id: string;
  phone: string;
  ewallet: string;
  is_winner: boolean;
  amount_won: number | null;
  created_at: string;
}

interface GiveawaySpinWheelProps {
  formId: string;
  formTitle: string;
}

const ewalletColors: Record<string, string> = {
  dana: "bg-blue-500",
  ovo: "bg-purple-500",
  gopay: "bg-green-500",
};

const ewalletGradients: Record<string, string> = {
  dana: "from-blue-500 to-cyan-500",
  ovo: "from-purple-500 to-fuchsia-500",
  gopay: "from-green-500 to-emerald-500",
};

const ewalletLabels: Record<string, string> = {
  dana: "DANA",
  ovo: "OVO",
  gopay: "GoPay",
};

const formatRupiah = (n: number | null | undefined) =>
  "Rp " + (n || 0).toLocaleString("id-ID");

interface FormGiveawayConfig {
  giveaway_mode: "equal" | "random";
  giveaway_total_amount: number;
  giveaway_winner_count: number;
}

export function GiveawaySpinWheel({ formId, formTitle }: GiveawaySpinWheelProps) {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [config, setConfig] = useState<FormGiveawayConfig | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<GiveawayEntry | null>(null);
  const [winners, setWinners] = useState<GiveawayEntry[]>([]);
  const [rotation, setRotation] = useState(0);

  const fetchData = async () => {
    const [entriesRes, formRes] = await Promise.all([
      supabase.from("giveaway_entries").select("*").eq("form_id", formId).order("created_at", { ascending: false }),
      supabase.from("forms").select("giveaway_mode, giveaway_total_amount, giveaway_winner_count").eq("id", formId).single(),
    ]);
    if (entriesRes.data) {
      const list = entriesRes.data as unknown as GiveawayEntry[];
      setEntries(list);
      setWinners(list.filter((e) => e.is_winner));
    }
    if (formRes.data) {
      setConfig({
        giveaway_mode: ((formRes.data as any).giveaway_mode as "equal" | "random") || "equal",
        giveaway_total_amount: (formRes.data as any).giveaway_total_amount || 0,
        giveaway_winner_count: (formRes.data as any).giveaway_winner_count || 1,
      });
    }
  };

  useEffect(() => { fetchData(); }, [formId]);

  const nonWinners = entries.filter((e) => !e.is_winner);
  const currentWinnersCount = entries.filter((e) => e.is_winner).length;
  const remainingSlots = config ? Math.max(config.giveaway_winner_count - currentWinnersCount, 0) : 0;

  const totalAwarded = entries
    .filter((e) => e.is_winner)
    .reduce((s, e) => s + (e.amount_won || 0), 0);
  const remainingPool = config ? Math.max(config.giveaway_total_amount - totalAwarded, 0) : 0;

  const roundTo500 = (n: number) => Math.max(500, Math.floor(n / 500) * 500);

  const computeAmountForNextWinner = (): number => {
    if (!config) return 0;
    if (remainingSlots <= 0) return 0;
    if (config.giveaway_mode === "equal") {
      return roundTo500(Math.floor(config.giveaway_total_amount / config.giveaway_winner_count));
    }
    if (remainingSlots === 1) return roundTo500(remainingPool);
    const minPerWinner = 500;
    const reserveForOthers = (remainingSlots - 1) * minPerWinner;
    const safeMax = Math.max(minPerWinner, remainingPool - reserveForOthers);
    // Perlebar variasi: rata-rata sisa pool per pemenang, lalu kali pengali 0.3x - 2.2x
    const avg = remainingPool / remainingSlots;
    const multiplier = 0.3 + Math.random() * 1.9; // 0.3x - 2.2x
    const raw = Math.min(safeMax, Math.max(minPerWinner, avg * multiplier));
    return roundTo500(raw);
  };

  const handleSpin = async () => {
    if (!config) {
      popup.error("Konfigurasi giveaway belum dimuat");
      return;
    }
    if (nonWinners.length === 0) {
      popup.error("Tidak ada peserta yang tersedia untuk spin");
      return;
    }
    if (remainingSlots === 0) {
      popup.error("Semua slot pemenang sudah terisi");
      return;
    }
    setSpinning(true);
    setWinner(null);

    const spins = 5 + Math.random() * 5;
    setRotation((prev) => prev + spins * 360);

    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * nonWinners.length);
      const selected = nonWinners[randomIndex];
      const amount = computeAmountForNextWinner();

      const { error } = await supabase
        .from("giveaway_entries")
        .update({ is_winner: true, amount_won: amount } as any)
        .eq("id", selected.id);

      if (error) {
        popup.error("Gagal menyimpan pemenang");
        setSpinning(false);
        return;
      }

      setWinner({ ...selected, is_winner: true, amount_won: amount });
      setSpinning(false);
      fetchData();
    }, 3000);
  };

  const formatPhoneForWA = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
    if (!cleaned.startsWith("62")) cleaned = "62" + cleaned;
    return cleaned;
  };

  const handleShare = (entry: GiveawayEntry) => {
    const amountText = entry.amount_won ? ` sebesar ${formatRupiah(entry.amount_won)}` : "";
    const waNumber = formatPhoneForWA(entry.phone);
    const waMessage = encodeURIComponent(
      `Selamat! Kamu terpilih sebagai pemenang Giveaway "${formTitle}".\n\nHadiah${amountText} akan dikirim ke ${ewalletLabels[entry.ewallet] || entry.ewallet} kamu.\n\nPowered by FormGua`
    );
    window.open(`https://wa.me/${waNumber}?text=${waMessage}`, "_blank");
  };

  const progressPercent = config && config.giveaway_winner_count > 0
    ? Math.round((currentWinnersCount / config.giveaway_winner_count) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Hero Stats Card */}
      {config && config.giveaway_total_amount > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-4 sm:p-5">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Giveaway Aktif</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Mode: <span className="font-semibold text-foreground">{config.giveaway_mode === "equal" ? "Bagi Rata" : "Nominal Acak"}</span>
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-md">
              {progressPercent}%
            </Badge>
          </div>

          {/* Stats grid */}
          <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-background/60 backdrop-blur border border-border/60 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Coins className="h-3 w-3" />
                <span>Total</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground leading-tight truncate">{formatRupiah(config.giveaway_total_amount)}</p>
            </div>
            <div className="rounded-xl bg-background/60 backdrop-blur border border-border/60 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Wallet className="h-3 w-3" />
                <span>Sisa</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-primary leading-tight truncate">{formatRupiah(remainingPool)}</p>
            </div>
            <div className="rounded-xl bg-background/60 backdrop-blur border border-border/60 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Crown className="h-3 w-3" />
                <span>Pemenang</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground leading-tight">{currentWinnersCount}/{config.giveaway_winner_count}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-4">
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Spin Section — wheel */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-card to-background p-5 sm:p-6 text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm sm:text-base">Spin Pemenang</h3>
        </div>

        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mb-5">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{entries.length} peserta</span>
          <span className="text-border">•</span>
          <span>{nonWinners.length} kandidat</span>
          <span className="text-border">•</span>
          <span className="text-primary font-semibold">{remainingSlots} slot</span>
        </div>

        {/* Wheel */}
        <div className="relative mx-auto mb-6 w-52 h-52 sm:w-60 sm:h-60">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-md" />

          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 0.99] }}
            className="relative w-full h-full rounded-full border-[6px] border-primary/40 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 flex items-center justify-center overflow-hidden shadow-xl"
          >
            {/* Pie slices */}
            {nonWinners.length > 0 && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {nonWinners.slice(0, 12).map((_, i) => {
                  const slice = nonWinners.slice(0, 12).length;
                  const angle = 360 / slice;
                  const startAngle = i * angle - 90;
                  const endAngle = startAngle + angle;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);
                  const largeArc = angle > 180 ? 1 : 0;
                  const fillOpacity = i % 2 === 0 ? 0.18 : 0.08;
                  return (
                    <path
                      key={i}
                      d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc} 1 ${x2},${y2} Z`}
                      fill="hsl(var(--primary))"
                      fillOpacity={fillOpacity}
                      stroke="hsl(var(--primary))"
                      strokeOpacity="0.25"
                      strokeWidth="0.3"
                    />
                  );
                })}
              </svg>
            )}

            {/* Phone labels */}
            {nonWinners.slice(0, 12).map((entry, i) => {
              const slice = Math.min(nonWinners.length, 12);
              const angle = (360 / slice) * i + (360 / slice) / 2;
              return (
                <div
                  key={entry.id}
                  className="absolute text-[9px] font-semibold text-foreground/80 truncate max-w-[58px] flex flex-col items-center"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-78px) rotate(${-angle}deg)`,
                  }}
                >
                  <Smartphone className="h-2.5 w-2.5 mb-0.5 opacity-60" />
                  ···{entry.phone.slice(-4)}
                </div>
              );
            })}

            {/* Center hub */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/40 border-4 border-background">
              <Gift className={`h-7 w-7 text-primary-foreground ${spinning ? "animate-bounce" : ""}`} />
            </div>
          </motion.div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 drop-shadow-lg">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-primary" />
            <div className="w-3 h-3 rounded-full bg-primary mx-auto -mt-1 border-2 border-background" />
          </div>
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning || nonWinners.length === 0 || remainingSlots === 0}
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30 font-bold px-8"
        >
          {spinning ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin" />
              Memutar...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              SPIN!
            </>
          )}
        </Button>
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 14 }}
            className="relative rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-5 sm:p-6 text-center shadow-2xl shadow-amber-500/20"
          >
            {/* Confetti dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: [0, 1, 0], y: [0, 80] }}
                transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${10 + i * 11}%`,
                  top: "10%",
                  background: ["#fbbf24", "#f97316", "#ec4899", "#8b5cf6", "#3b82f6"][i % 5],
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
              className="relative inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-xl shadow-amber-500/50 mb-3"
            >
              <Trophy className="h-8 w-8 text-white" />
            </motion.div>

            <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-1">🎉 Pemenang Terpilih</p>
            <h4 className="font-extrabold text-xl mb-2">{winner.phone}</h4>

            <Badge className={`bg-gradient-to-r ${ewalletGradients[winner.ewallet] || "from-primary to-accent"} text-white border-0 shadow-md`}>
              {ewalletLabels[winner.ewallet] || winner.ewallet}
            </Badge>

            {winner.amount_won != null && winner.amount_won > 0 && (
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mt-3 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent"
              >
                {formatRupiah(winner.amount_won)}
              </motion.p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare(winner)}
              className="gap-1.5 mt-4 border-amber-500/40 hover:bg-amber-500/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              Kirim Notifikasi via WhatsApp
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winners list */}
      {winners.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Trophy className="h-3.5 w-3.5 text-white" />
            </div>
            Daftar Pemenang
            <Badge variant="secondary" className="ml-auto text-[10px]">{winners.length}</Badge>
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {winners.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{w.phone}</p>
                    <Badge className={`text-[9px] mt-0.5 bg-gradient-to-r ${ewalletGradients[w.ewallet] || "from-muted to-muted"} text-white border-0 px-1.5 py-0`}>
                      {ewalletLabels[w.ewallet] || w.ewallet}
                    </Badge>
                  </div>
                </div>
                {w.amount_won != null && w.amount_won > 0 && (
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 shrink-0">{formatRupiah(w.amount_won)}</span>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-amber-500/10" onClick={() => handleShare(w)}>
                  <Share2 className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Entries */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          Semua Peserta
          <Badge variant="secondary" className="ml-auto text-[10px]">{entries.length}</Badge>
        </h4>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Belum ada peserta giveaway</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {entries.map((e) => (
              <div
                key={e.id}
                className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg text-xs transition-colors ${
                  e.is_winner ? "bg-amber-500/5 border border-amber-500/20" : "hover:bg-muted/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate font-medium">{e.phone}</span>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${ewalletColors[e.ewallet] || "bg-muted"} text-white border-0`}>
                    {ewalletLabels[e.ewallet] || e.ewallet}
                  </Badge>
                </div>
                {e.is_winner && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {e.amount_won != null && e.amount_won > 0 && (
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">{formatRupiah(e.amount_won)}</span>
                    )}
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
