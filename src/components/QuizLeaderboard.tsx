import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Row {
  id: string;
  participant_name: string | null;
  score: number | null;
  max_score: number | null;
  created_at: string;
}

interface Props {
  formId: string;
  currentResponseId?: string | null;
  accentBg?: string;
  accentText?: string;
}

export function QuizLeaderboard({ formId, currentResponseId, accentBg = "bg-primary", accentText = "text-primary" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("id, participant_name, score, max_score, created_at")
      .eq("form_id", formId)
      .eq("completed", true)
      .not("score", "is", null)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel(`leaderboard-${formId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "form_responses", filter: `form_id=eq.${formId}` },
        () => fetchRows()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const rankIcon = (idx: number) => {
    if (idx === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (idx === 1) return <Medal className="h-4 w-4 text-slate-400" />;
    if (idx === 2) return <Award className="h-4 w-4 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{idx + 1}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat leaderboard...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 ${accentBg} text-white`}>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <h3 className="font-bold text-sm">Leaderboard Realtime</h3>
        </div>
        <button
          onClick={fetchRows}
          className="opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        <AnimatePresence initial={false}>
          {rows.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">Belum ada peserta yang selesai.</p>
          )}
          {rows.map((r, idx) => {
            const isMe = r.id === currentResponseId;
            const pct = r.max_score && r.max_score > 0 ? Math.round(((r.score || 0) / r.max_score) * 100) : 0;
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isMe ? `${accentBg.replace("bg-", "bg-").replace(/-\d+$/, "-500/10")} ring-1 ring-inset ring-primary/40` : ""}`}
              >
                <div className="w-5 flex justify-center">{rankIcon(idx)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate font-medium ${isMe ? accentText : ""}`}>
                    {r.participant_name || "Peserta"} {isMe && <span className="text-[10px] font-semibold uppercase ml-1">· kamu</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{pct}% · {new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="text-right">
                  <div className={`text-base font-extrabold ${accentText}`}>{r.score ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">/ {r.max_score ?? 0}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
