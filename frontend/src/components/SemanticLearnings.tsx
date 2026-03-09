"use client";

import { useState } from "react";
import SectionCard from "@/components/ui/SectionCard";
import type { SystemLearning, CombinedLearning } from "@/lib/api";
import { incidentLabel, formatPercent, formatMinutes } from "@/lib/format";

interface Props {
  systemData: SystemLearning[] | null;
  combinedData: CombinedLearning[] | null;
  anecdotalData: Record<string, unknown>[] | null;
  loading: boolean;
}

export default function SemanticLearnings({ systemData, combinedData, anecdotalData, loading }: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("system");

  if (loading) {
    return (
      <SectionCard title="Semantic Learnings" accent="purple" description="AI-generated insights from incident patterns — system learnings are auto-extracted, manager learnings are manually uploaded, and combined merges both.">
        <div className="p-5"><div className="shimmer h-[300px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  const filterBySearch = <T,>(items: T[] | null): T[] => {
    if (!items) return [];
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) =>
      Object.values(item as Record<string, unknown>).some((v) => String(v).toLowerCase().includes(lower))
    );
  };

  const tabs = [
    { key: "system", label: "System", count: systemData?.length || 0 },
    { key: "uploaded", label: "Manager", count: anecdotalData?.length || 0 },
    { key: "combined", label: "Combined", count: combinedData?.length || 0 },
  ];

  return (
    <SectionCard title="Semantic Learnings" accent="purple" description="AI-generated insights from incident patterns — system learnings are auto-extracted, manager learnings are manually uploaded, and combined merges both.">
      <div className="p-5">
        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Search learnings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg text-sm text-[var(--dark-text)] placeholder:text-[var(--dark-text-muted)] focus:border-[var(--accent-purple)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-[var(--accent-purple-dim)] text-[var(--accent-purple)] border-b-2 border-[var(--accent-purple)]"
                    : "text-[var(--dark-text-muted)] hover:text-[var(--dark-text-secondary)]"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "system" && (
          <div className="flex flex-col gap-3">
            {filterBySearch(systemData).map((l, i) => (
              <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4 hover:border-[var(--dark-border)] transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">{incidentLabel(l.incident_type)}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[var(--accent-green)]/30">{formatPercent(l.auto_resolution_rate)} auto</span>
                  {l.avg_tat && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30">{formatMinutes(l.avg_tat)} avg</span>}
                </div>
                <p className="text-xs text-[var(--dark-text-muted)]">{l.pattern}</p>
                <p className="text-sm text-[var(--dark-text-secondary)] mt-1">{l.key_insight}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "uploaded" && (
          <div className="flex flex-col gap-3">
            {anecdotalData && anecdotalData.length > 0 ? (
              filterBySearch(anecdotalData).map((l, i) => (
                <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4 hover:border-[var(--dark-border)] transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {Boolean(l.agent_type) && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]">{String(l.agent_type)}</span>}
                    {Boolean(l.incident_type) && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]">{String(l.incident_type)}</span>}
                    {Boolean(l.priority) && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]">{String(l.priority)}</span>}
                  </div>
                  {Boolean(l.scenario) && <p className="text-xs text-[var(--dark-text-muted)]">{String(l.scenario)}</p>}
                  {Boolean(l.manager_learning) && <p className="text-sm text-[var(--dark-text-secondary)] mt-1">{String(l.manager_learning)}</p>}
                  {Boolean(l.recommended_action) && <p className="text-sm text-[var(--accent-green)] mt-1">Action: {String(l.recommended_action)}</p>}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[var(--dark-text-muted)]">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <p className="text-sm">No manager learnings uploaded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "combined" && (
          <div className="flex flex-col gap-3">
            {filterBySearch(combinedData).map((l, i) => (
              <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4 hover:border-[var(--dark-border)] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]">{incidentLabel(l.incident_type)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${l.source === "system" ? "bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]" : "bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"}`}>{l.source}</span>
                </div>
                <p className="text-sm text-[var(--dark-text-secondary)]">{l.key_insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
