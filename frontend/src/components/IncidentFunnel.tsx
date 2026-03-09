"use client";

import SectionCard from "@/components/ui/SectionCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FunnelStage } from "@/lib/api";
import { formatNumber } from "@/lib/format";

interface Props {
  data: FunnelStage[] | null;
  loading: boolean;
}

const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#6366f1", "#ef4444"];

export default function IncidentFunnel({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Incident Funnel" accent="purple" description="Visualises how incidents flow through stages — from total raised to auto-resolved, escalated, and closed.">
        <div className="p-5"><div className="shimmer h-[300px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Incident Funnel" accent="purple" description="Visualises how incidents flow through stages — from total raised to auto-resolved, escalated, and closed.">
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#2a3550" }} tickLine={false} />
            <YAxis type="category" dataKey="stage" width={100} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number) => [formatNumber(value), "Count"]}
              contentStyle={{ background: "#1a2236", border: "1px solid #2a3550", borderRadius: 8, color: "#e2e8f0" }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {data.map((stage, idx) => (
            <div key={stage.stage} className="text-center p-2 rounded-lg bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)]">
              <div className="text-[11px] text-[var(--dark-text-muted)] uppercase tracking-wide">{stage.stage}</div>
              <div className="text-base font-bold" style={{ color: COLORS[idx % COLORS.length] }}>{formatNumber(stage.count)}</div>
              <div className="text-[10px] text-[var(--dark-text-muted)]">{stage.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
