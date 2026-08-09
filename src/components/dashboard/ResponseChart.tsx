import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, BarChart3, LineChart as LineIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ChartType = "area" | "bar" | "line";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function buildWeekBuckets(): { name: string; date: string; responses: number }[] {
  const out: { name: string; date: string; responses: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      name: DAY_LABELS[d.getDay()],
      date: d.toISOString().slice(0, 10),
      responses: 0,
    });
  }
  return out;
}

export function ResponseChart() {
  const { user } = useAuth();
  const [data, setData] = useState(buildWeekBuckets());
  const [chartType, setChartType] = useState<ChartType>("area");
  const [total, setTotal] = useState(0);
  const [ownedFormIds, setOwnedFormIds] = useState<string[] | null>(null);

  // Ambil daftar form_id milik user (jika login). Untuk guest: form tanpa owner_id.
  const fetchOwnedFormIds = async (): Promise<string[] | null> => {
    let q = supabase.from("forms").select("id");
    if (user) q = q.eq("owner_id", user.id);
    else q = q.is("owner_id", null);
    const { data: rows } = await q;
    const ids = (rows || []).map((r: any) => r.id);
    setOwnedFormIds(ids);
    return ids;
  };

  const loadData = async (idsArg?: string[] | null) => {
    const ids = idsArg ?? ownedFormIds ?? (await fetchOwnedFormIds());
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const buckets = buildWeekBuckets();
    const map: Record<string, number> = {};
    buckets.forEach((b) => (map[b.date] = 0));

    if (ids && ids.length > 0) {
      const { data: rows } = await supabase
        .from("form_responses")
        .select("created_at, form_id")
        .gte("created_at", since.toISOString())
        .in("form_id", ids);

      (rows || []).forEach((r: any) => {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (key in map) map[key] += 1;
      });
    }

    const next = buckets.map((b) => ({ ...b, responses: map[b.date] || 0 }));
    setData(next);
    setTotal(next.reduce((s, b) => s + b.responses, 0));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await fetchOwnedFormIds();
      if (cancelled) return;
      await loadData(ids);
    })();

    // Realtime: refresh tiap insert/delete pada form_responses,
    // lalu filter di sisi loadData berdasarkan ownedFormIds.
    const channel = supabase
      .channel("response-chart-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "form_responses" },
        (payload: any) => {
          // hanya reload jika form_id-nya milik user
          if (!ownedFormIds || ownedFormIds.includes(payload?.new?.form_id)) {
            loadData();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "form_responses" },
        () => loadData()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };
  const axisTick = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
  const accent = "hsl(243, 75%, 59%)";

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
          <Bar dataKey="responses" fill={accent} radius={[6, 6, 0, 0]} />
        </BarChart>
      );
    }
    if (chartType === "line") {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="responses" stroke={accent} strokeWidth={2.5} dot={{ r: 4, fill: accent }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }
    return (
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
            <stop offset="95%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="responses" stroke={accent} fillOpacity={1} fill="url(#colorResponses)" strokeWidth={2} />
      </AreaChart>
    );
  };

  const chartButtons: { type: ChartType; icon: typeof Activity; label: string }[] = [
    { type: "area", icon: Activity, label: "Area" },
    { type: "bar", icon: BarChart3, label: "Bar" },
    { type: "line", icon: LineIcon, label: "Line" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            Respons Minggu Ini
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total {total} respons · realtime{user ? " · form kamu" : " · mode tamu"}
          </p>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
          {chartButtons.map((b) => {
            const Icon = b.icon;
            const active = chartType === b.type;
            return (
              <button
                key={b.type}
                onClick={() => setChartType(b.type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={b.label}
              >
                <Icon className="h-3 w-3" />
                {b.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
