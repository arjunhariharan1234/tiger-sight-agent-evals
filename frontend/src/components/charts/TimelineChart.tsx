"use client";

import SectionCard from "@/components/ui/SectionCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TimelineItem } from "@/lib/api";

interface Props {
  data: TimelineItem[] | null;
  loading: boolean;
}

export default function TimelineChart({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Incident Timeline" accent="cyan" description="Daily trend of incidents — total raised, auto-resolved, and critical — showing volume patterns over time.">
        <div className="p-5"><div className="shimmer h-[300px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Incident Timeline" accent="cyan" description="Daily trend of incidents — total raised, auto-resolved, and critical — showing volume patterns over time.">
      <div className="p-5">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAuto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#2a3550" }} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid #2a3550", borderRadius: 8, color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#gradTotal)" strokeWidth={2} name="Total" dot={false} />
            <Area type="monotone" dataKey="auto_resolved" stroke="#10b981" fill="url(#gradAuto)" strokeWidth={2} name="Auto Resolved" dot={false} />
            <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="url(#gradCritical)" strokeWidth={2} name="Critical" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
