import { motion } from "framer-motion";
import { FileText, BarChart3, CheckCircle2, TrendingUp } from "lucide-react";

interface QuickStatsProps {
  totalForms: number;
  totalResponses: number;
  completionRate: number;
  activeForms: number;
}

const stats: Array<{ key: keyof QuickStatsProps; label: string; icon: typeof FileText; color: string; suffix?: string }> = [
  { key: "totalForms", label: "Total Form", icon: FileText, color: "text-primary" },
  { key: "totalResponses", label: "Total Respons", icon: BarChart3, color: "text-accent" },
  { key: "completionRate", label: "Tingkat Selesai", icon: CheckCircle2, color: "text-emerald-500", suffix: "%" },
  { key: "activeForms", label: "Form Aktif", icon: TrendingUp, color: "text-amber-500" },
];

export function QuickStats({ totalForms, totalResponses, completionRate, activeForms }: QuickStatsProps) {
  const values = { totalForms, totalResponses, completionRate, activeForms };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-5 group hover:glow-ring transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {values[stat.key]}
            {stat.suffix || ""}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
