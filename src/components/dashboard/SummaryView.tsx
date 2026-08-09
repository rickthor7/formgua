import { motion } from "framer-motion";
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  fields: FormField[];
  created_at: string;
}

interface Response {
  id: string;
  data: Record<string, string>;
  completed: boolean;
  created_at: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

type ChartType = "bar" | "pie" | "horizontal";

export function SummaryView({ form, responses }: { form: FormData; responses: Response[] }) {
  return (
    <div className="space-y-6">
      {/* Response timeline */}
      <ResponseTimeline responses={responses} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.fields.map(field => {
          if (field.type === "radio" || field.type === "checkbox" || field.type === "likert" || field.type === "yesno") {
            const fieldWithOptions = field.type === "yesno"
              ? { ...field, options: ["Ya", "Tidak"] }
              : field;
            return <ChoiceFieldChart key={field.id} field={fieldWithOptions} responses={responses} />;
          }

          const answers = responses.map(r => r.data[field.id]).filter(Boolean);
          return (
            <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-1">{field.label}</h3>
              <p className="text-xs text-muted-foreground mb-3">{answers.length} jawaban</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {answers.slice(0, 10).map((ans, i) => (
                  <div key={i} className="text-sm py-1.5 px-3 bg-muted/50 rounded-lg truncate">{ans}</div>
                ))}
                {answers.length > 10 && <p className="text-xs text-muted-foreground text-center">+{answers.length - 10} jawaban lainnya</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseTimeline({ responses }: { responses: Response[] }) {
  if (responses.length === 0) return null;

  const dateMap: Record<string, number> = {};
  responses.forEach(r => {
    const d = new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    dateMap[d] = (dateMap[d] || 0) + 1;
  });

  const data = Object.entries(dateMap).reverse().slice(-14).map(([name, value]) => ({ name, value }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Tren Respons (14 hari terakhir)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Respons" />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function ChoiceFieldChart({ field, responses }: { field: FormField; responses: Response[] }) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const counts: Record<string, number> = {};
  responses.forEach(r => {
    const val = r.data[field.id];
    if (val) {
      val.split(",").forEach(v => {
        const trimmed = v.trim();
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
      });
    }
  });
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  const chartData = (field.options || []).map(opt => ({
    name: opt,
    value: counts[opt] || 0,
    pct: total > 0 ? Math.round(((counts[opt] || 0) / total) * 100) : 0,
  }));

  const chartTypes: { value: ChartType; label: string }[] = [
    { value: "bar", label: "Bar" },
    { value: "pie", label: "Pie" },
    { value: "horizontal", label: "H-Bar" },
  ];

  const isLikert = field.type === "likert";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{field.label}</h3>
        <div className="flex items-center rounded-md border border-border bg-secondary/50 p-0.5">
          {chartTypes.map(ct => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${chartType === ct.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>
      {isLikert && (
        <p className="text-[10px] text-muted-foreground mb-3">1 = Sangat Tidak Setuju · 2 = Tidak Setuju · 3 = Netral · 4 = Setuju · 5 = Sangat Setuju</p>
      )}

      {chartType === "pie" ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} (${Math.round((percent || 0) * 100)}%)`} labelLine={false} fontSize={10}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : chartType === "horizontal" ? (
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 100)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={80} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" name="Jawaban" radius={[0, 4, 4, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" name="Jawaban" radius={[4, 4, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {chartData.map((d, idx) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
              <span>{d.name}</span>
            </div>
            <span className="text-muted-foreground">{d.value} ({d.pct}%)</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}