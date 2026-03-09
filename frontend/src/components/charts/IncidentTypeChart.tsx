"use client";

import SectionCard from "@/components/ui/SectionCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { IncidentTypeItem } from "@/lib/api";
import { incidentLabel } from "@/lib/format";

interface Props {
  data: IncidentTypeItem[] | null;
  loading: boolean;
}

const BAR_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#a855f7", "#22d3ee", "#84cc16"];

export default function IncidentTypeChart({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Incidents by Type" accent="cyan" description="Count of incidents grouped by type (long stoppage, tracking, detention, route deviation, etc.) — shows which categories generate the most alerts.">
        <div className="p-5"><div className="shimmer h-[300px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    name: incidentLabel(d.incident_type),
  }));

  return (
    <SectionCard title="Incidents by Type" accent="cyan" description="Count of incidents grouped by type (long stoppage, tracking, detention, route deviation, etc.) — shows which categories generate the most alerts.">
      <div className="p-5">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#2a3550" }} tickLine={false} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid #2a3550", borderRadius: 8, color: "#e2e8f0" }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
