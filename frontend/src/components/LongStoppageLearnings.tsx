"use client";

import SectionCard from "@/components/ui/SectionCard";

const LEARNINGS = [
  {
    title: "High Auto-Resolution Rate",
    detail: "78.7% of long stoppage incidents (605 out of 769) were auto-resolved by the AI agent, demonstrating strong autonomous handling capability.",
    metric: "78.7%",
    metricLabel: "Auto-Resolved",
    color: "var(--accent-green)",
  },
  {
    title: "Critical Severity Dominates",
    detail: "36.7% of long stoppages are classified as CRITICAL (282 incidents), followed by MEDIUM at 56.9% (438). Even critical incidents maintain a 77% auto-resolution rate.",
    metric: "282",
    metricLabel: "Critical Incidents",
    color: "var(--accent-red)",
  },
  {
    title: "Stoppage Duration Varies Widely",
    detail: "Average stoppage duration is 6.7 hours (median 2.4h). 33% of stoppages are under 1 hour, while 4.6% exceed 24 hours — indicating a long tail of severe cases needing attention.",
    metric: "6.7h",
    metricLabel: "Avg Duration",
    color: "var(--accent-primary)",
  },
  {
    title: "Resolution TAT Needs Improvement",
    detail: "Mean resolution turnaround time is 17.3 hours with a P90 of 39.7 hours. Faster escalation pathways for extended stoppages could reduce this significantly.",
    metric: "17.3h",
    metricLabel: "Mean TAT",
    color: "var(--accent-blue)",
  },
  {
    title: "Concentrated Customer Impact",
    detail: "96.2% of long stoppages (740 of 769) affect Ultratech Cement Limited, with only 18 affecting JSWOne Distribution. Targeted optimisation for Ultratech routes would have outsized impact.",
    metric: "96.2%",
    metricLabel: "Ultratech Share",
    color: "var(--accent-purple)",
  },
  {
    title: "Top Corridors Are Repeat Offenders",
    detail: "Bellary-STO to Yemmiganur (57 incidents), Chitradurga-STO to Belgur (46), and Bellary-STO to Hospet (39) are the top 3 routes. Focused corridor interventions could prevent recurring stoppages.",
    metric: "90",
    metricLabel: "Unique Routes",
    color: "var(--accent-cyan)",
  },
  {
    title: "139 Active Incidents Pending",
    detail: "18.1% of long stoppages remain in ACTIVE status (neither auto-resolved nor manually resolved), representing an opportunity to improve closure rates through better escalation workflows.",
    metric: "18.1%",
    metricLabel: "Still Active",
    color: "var(--accent-amber)",
  },
  {
    title: "Manual Intervention Is Rare",
    detail: "Only 25 incidents (3.3%) required manual resolution, suggesting the AI agent handles the vast majority effectively. Focus manual effort on the complex edge cases that the agent cannot resolve.",
    metric: "3.3%",
    metricLabel: "Manual Resolved",
    color: "var(--accent-green)",
  },
];

export default function LongStoppageLearnings() {
  return (
    <SectionCard title="Long Stoppage Learnings" accent="amber">
      <div className="p-5">
        <p className="text-sm text-[var(--dark-text-secondary)] mb-4">
          Key patterns and insights extracted from <span className="font-semibold text-[var(--accent-primary)]">769 long stoppage incidents</span> in the dataset, covering duration analysis, resolution patterns, and corridor-level observations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEARNINGS.map((l) => (
            <div key={l.title} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4 hover:border-[var(--dark-border)] transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-[var(--dark-text)]">{l.title}</h4>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold" style={{ color: l.color }}>{l.metric}</div>
                  <div className="text-[10px] text-[var(--dark-text-muted)] uppercase tracking-wide">{l.metricLabel}</div>
                </div>
              </div>
              <p className="text-xs text-[var(--dark-text-muted)] leading-relaxed">{l.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
