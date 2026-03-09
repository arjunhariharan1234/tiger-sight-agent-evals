"use client";

import SectionCard from "@/components/ui/SectionCard";

interface Props {
  visible: boolean;
}

const IMPROVEMENTS = [
  { category: "Long Stoppage", color: "var(--accent-red)", suggestions: [
    "Verify plant queue status before escalation",
    "Add transporter reliability scoring for repeat offenders",
    "Implement predictive stoppage alerts using historical patterns",
  ]},
  { category: "Tracking", color: "var(--accent-cyan)", suggestions: [
    "Improve geofence accuracy at loading/unloading points",
    "Add fallback tracking via transporter app",
    "Trigger SIM-based tracking when GPS fails",
  ]},
  { category: "Detention", color: "var(--accent-amber)", suggestions: [
    "Pre-schedule unloading slots to reduce wait times",
    "Alert warehouse team 2 hours before ETA",
    "Track detention cost per corridor",
  ]},
  { category: "Route", color: "var(--accent-purple)", suggestions: [
    "Adjust route deviation threshold for known detour corridors",
    "Cross-reference deviation with toll plaza data",
    "Add approved deviation routes to whitelist",
  ]},
  { category: "General", color: "var(--accent-blue)", suggestions: [
    "Analyze root cause patterns by corridor and transporter",
    "Monitor resolution TAT trends for continuous improvement",
    "Increase automation coverage for repetitive incident types",
  ]},
];

export default function ImprovementPanel({ visible }: Props) {
  if (!visible) return null;

  return (
    <SectionCard title="Improvement Suggestions" accent="amber" description="Actionable recommendations to improve AI agent performance — grouped by incident category with specific next steps.">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30">
            <span className="text-xs font-medium text-[var(--accent-amber)]">Internal View Only</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPROVEMENTS.map((group) => (
            <div key={group.category} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4 hover:border-[var(--dark-border)] transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                <h4 className="text-sm font-semibold" style={{ color: group.color }}>{group.category}</h4>
              </div>
              <ul className="flex flex-col gap-2">
                {group.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-[var(--dark-text-secondary)] flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: group.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
