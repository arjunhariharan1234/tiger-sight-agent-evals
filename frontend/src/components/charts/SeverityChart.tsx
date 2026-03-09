"use client";

import SectionCard from "@/components/ui/SectionCard";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { SeverityItem } from "@/lib/api";
import { formatNumber } from "@/lib/format";

interface Props {
  data: SeverityItem[] | null;
  loading: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#3b82f6",
  LOW: "#10b981",
};

export default function SeverityChart({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Severity Distribution" accent="red" description="Breakdown of incidents by severity level (Critical, High, Medium, Low) — helps prioritise where the AI agent should focus.">
        <div className="p-5"><div className="shimmer h-[250px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <SectionCard title="Severity Distribution" accent="red" description="Breakdown of incidents by severity level (Critical, High, Medium, Low) — helps prioritise where the AI agent should focus.">
      <div className="p-5 flex items-center gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || "#64748b"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid #2a3550", borderRadius: 8, color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 min-w-[140px]">
          {data.map((entry) => (
            <div key={entry.severity} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: SEVERITY_COLORS[entry.severity] || "#64748b" }} />
              <div className="flex-1">
                <div className="text-xs text-[var(--dark-text-muted)]">{entry.severity}</div>
                <div className="text-sm font-semibold text-[var(--dark-text)]">{formatNumber(entry.count)} <span className="text-[var(--dark-text-muted)] font-normal text-xs">({(entry.count / total * 100).toFixed(1)}%)</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
