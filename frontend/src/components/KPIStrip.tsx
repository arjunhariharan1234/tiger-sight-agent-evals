"use client";

import type { KPIs } from "@/lib/api";
import { formatNumber, formatCurrency, formatMinutes, formatPercent } from "@/lib/format";

interface Props {
  data: KPIs | null;
  loading: boolean;
}

interface KPICardProps {
  label: string;
  value: string;
  color: string;
  bgDim: string;
  icon: React.ReactNode;
  description: string;
}

function KPICard({ label, value, color, bgDim, icon, description }: KPICardProps) {
  return (
    <div className={`relative bg-[var(--dark-card)] border border-[var(--dark-border)] rounded-2xl p-4 glow-border overflow-hidden group transition-all duration-200 hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[40px] opacity-20`} style={{ background: bgDim }} />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 z-10">
          <span className="term-tooltip text-[11px] font-medium uppercase tracking-wider text-[var(--dark-text-muted)] cursor-help">
            {label}
            <span className="term-tip">{description}</span>
          </span>
          <span className="text-xl font-bold" style={{ color }}>{value}</span>
        </div>
        <div className="opacity-40 group-hover:opacity-80 transition-opacity" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-[var(--dark-card)] border border-[var(--dark-border)] rounded-lg p-4">
      <div className="shimmer h-3 w-16 rounded mb-2" />
      <div className="shimmer h-6 w-12 rounded" />
    </div>
  );
}

const icons = {
  incidents: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  critical: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  auto: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  manual: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  clock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  spark: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  chart: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
};

export default function KPIStrip({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {Array.from({ length: 9 }).map((_, i) => <LoadingSkeleton key={i} />)}
      </div>
    );
  }

  const kpis: KPICardProps[] = [
    { label: "Total Incidents", value: formatNumber(data.total_incidents), color: "var(--accent-primary)", bgDim: "var(--accent-primary)", icon: icons.incidents, description: "Total number of logistics alerts raised across all incident types (e.g. long stoppage, tracking, detention)." },
    { label: "Critical", value: formatNumber(data.critical_incidents), color: "var(--accent-red)", bgDim: "var(--accent-red)", icon: icons.critical, description: "Incidents marked as CRITICAL severity — requiring immediate attention due to high business impact." },
    { label: "Auto Resolved", value: formatPercent(data.auto_resolved_pct), color: "var(--accent-green)", bgDim: "var(--accent-green)", icon: icons.auto, description: "Percentage of incidents the AI agent resolved autonomously without any human intervention." },
    { label: "Manual", value: formatPercent(data.manual_intervention_pct), color: "var(--accent-amber)", bgDim: "var(--accent-amber)", icon: icons.manual, description: "Percentage of incidents that required a human operator to step in and resolve manually." },
    { label: "Avg TAT", value: formatMinutes(data.avg_resolution_tat), color: "var(--accent-blue)", bgDim: "var(--accent-blue)", icon: icons.clock, description: "Average Turnaround Time — the mean time taken from when an incident is raised to when it is resolved." },
    { label: "P90 TAT", value: formatMinutes(data.p90_resolution_tat), color: "var(--accent-purple)", bgDim: "var(--accent-purple)", icon: icons.clock, description: "90th percentile resolution time — 90% of incidents are resolved within this duration. Highlights worst-case scenarios." },
    { label: "Value Protected", value: formatCurrency(data.shipment_value_protected), color: "var(--accent-green)", bgDim: "var(--accent-green)", icon: icons.shield, description: "Total shipment value (in INR) that was protected from risk by timely AI intervention and incident resolution." },
    { label: "AI Value", value: formatCurrency(data.ai_value_delivered), color: "var(--accent-primary)", bgDim: "var(--accent-primary)", icon: icons.spark, description: "Total monetary value delivered by the AI system — includes penalties avoided, delay costs saved, and productivity gains." },
    { label: "Confidence", value: formatPercent(data.avg_confidence_score), color: "var(--accent-purple)", bgDim: "var(--accent-purple)", icon: icons.chart, description: "Average confidence score of the AI agent's decisions, based on data completeness, resolution speed, and pattern matching." },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
