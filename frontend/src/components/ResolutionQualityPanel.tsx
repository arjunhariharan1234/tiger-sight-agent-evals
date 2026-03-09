"use client";

import SectionCard from "@/components/ui/SectionCard";
import type { ResolutionQuality } from "@/lib/api";
import { formatPercent, formatMinutes } from "@/lib/format";

interface Props {
  data: ResolutionQuality | null;
  loading: boolean;
}

export default function ResolutionQualityPanel({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Resolution Quality" accent="green" description="Measures how effectively incidents are being resolved — auto-resolution success, escalation frequency, false positive rate, and resolution speed.">
        <div className="p-5 grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}><div className="shimmer h-16 rounded-lg" /></div>
          ))}
        </div>
      </SectionCard>
    );
  }

  const metrics = [
    { label: "Auto Resolution", value: formatPercent(data.auto_resolution_success_rate), color: "var(--accent-green)", tip: "Rate at which the AI agent successfully resolves incidents without human help." },
    { label: "Escalation Rate", value: formatPercent(data.escalation_rate), color: "var(--accent-amber)", tip: "Percentage of incidents escalated to a human operator because the AI could not resolve them." },
    { label: "Reopen Rate", value: formatPercent(data.reopen_rate), color: "var(--accent-blue)", tip: "Percentage of resolved incidents that were reopened — indicates resolution quality issues." },
    { label: "False Positives", value: formatPercent(data.false_positive_rate), color: "var(--accent-purple)", tip: "Alerts that turned out to be non-issues — a lower rate means better alert accuracy." },
    { label: "P50 Resolution", value: formatMinutes(data.p50_resolution_time), color: "var(--accent-cyan)", tip: "Median resolution time — 50% of incidents are resolved within this duration." },
    { label: "P90 Resolution", value: formatMinutes(data.p90_resolution_time), color: "var(--accent-red)", tip: "90th percentile resolution time — only 10% of incidents take longer than this." },
  ];

  return (
    <SectionCard title="Resolution Quality" accent="green" description="Measures how effectively incidents are being resolved — auto-resolution success, escalation frequency, false positive rate, and resolution speed.">
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-3 transition-all hover:border-[var(--dark-border)]">
            <span className="term-tooltip text-[11px] font-medium uppercase tracking-wider text-[var(--dark-text-muted)] cursor-help">
              {m.label}
              <span className="term-tip">{m.tip}</span>
            </span>
            <div className="mt-1">
              <span className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
