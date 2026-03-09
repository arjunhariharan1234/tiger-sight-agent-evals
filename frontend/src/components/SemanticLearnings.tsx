"use client";

import { useState } from "react";
import SectionCard from "@/components/ui/SectionCard";
import type { SystemLearning, CombinedLearning } from "@/lib/api";
import { incidentLabel, formatPercent, formatMinutes } from "@/lib/format";

interface EnrichedLearning extends SystemLearning {
  resolution_steps?: string[];
  top_routes?: Record<string, number>;
  known_transporters?: Record<string, number>;
  severity_breakdown?: Record<string, number>;
  avg_risk_score?: number | null;
  avg_confidence_score?: number | null;
  active_count?: number;
  manual_count?: number;
}

interface Props {
  systemData: EnrichedLearning[] | null;
  combinedData: CombinedLearning[] | null;
  anecdotalData: Record<string, unknown>[] | null;
  loading: boolean;
}

export default function SemanticLearnings({ systemData, combinedData, anecdotalData, loading }: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("system");
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <SectionCard title="Semantic Learnings" accent="purple" description="AI-generated insights enriched from state history — includes resolution pathways, owner/transporter context, and corridor-level observations.">
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
              className="w-full pl-10 pr-4 py-2 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl text-sm text-[var(--dark-text)] placeholder:text-[var(--dark-text-muted)] focus:border-[var(--accent-purple)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl overflow-hidden">
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

        {/* System tab — enriched */}
        {activeTab === "system" && (
          <div className="flex flex-col gap-3">
            {filterBySearch(systemData as EnrichedLearning[]).map((l, i) => {
              const isExpanded = expanded === `system-${i}`;
              return (
                <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-xl p-4 hover:border-[var(--dark-border)] transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">{incidentLabel(l.incident_type)}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[var(--accent-green)]/30">{formatPercent(l.auto_resolution_rate)} auto</span>
                    {l.avg_tat && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30">{formatMinutes(l.avg_tat)} avg</span>}
                    {(l.active_count ?? 0) > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30">{l.active_count} active</span>}
                    {(l.manual_count ?? 0) > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[var(--accent-red)]/30">{l.manual_count} manual</span>}
                  </div>
                  <p className="text-xs text-[var(--dark-text-muted)]">{l.pattern}</p>
                  <p className="text-sm text-[var(--dark-text-secondary)] mt-1">{l.key_insight}</p>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : `system-${i}`)}
                    className="mt-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)] font-medium cursor-pointer flex items-center gap-1"
                  >
                    <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    {isExpanded ? "Hide details" : "Resolution steps & context"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--dark-border-subtle)] flex flex-col gap-3">
                      {/* Resolution steps */}
                      {l.resolution_steps && l.resolution_steps.length > 0 && (
                        <div>
                          <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-purple)] mb-1.5">Resolution Pathway</h5>
                          <ol className="flex flex-col gap-1">
                            {l.resolution_steps.map((step: string, si: number) => (
                              <li key={si} className="text-xs text-[var(--dark-text-secondary)] flex items-start gap-2">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--accent-purple-dim)] text-[var(--accent-purple)] text-[10px] flex items-center justify-center font-bold mt-0.5">{si + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Top Routes */}
                        {l.top_routes && Object.keys(l.top_routes).length > 0 && (
                          <div>
                            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-cyan)] mb-1.5">Top Corridors</h5>
                            {Object.entries(l.top_routes).map(([route, count]) => (
                              <div key={route} className="flex justify-between text-xs py-0.5">
                                <span className="text-[var(--dark-text-muted)] truncate mr-2" title={route}>{route.length > 50 ? route.slice(0, 50) + "..." : route}</span>
                                <span className="text-[var(--dark-text-secondary)] font-medium flex-shrink-0">{String(count)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Transporters / Severity */}
                        <div>
                          {l.known_transporters && Object.keys(l.known_transporters).length > 0 && (
                            <div className="mb-2">
                              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-green)] mb-1.5">Known Transporters</h5>
                              {Object.entries(l.known_transporters).map(([name, count]) => (
                                <div key={name} className="flex justify-between text-xs py-0.5">
                                  <span className="text-[var(--dark-text-muted)]">{name}</span>
                                  <span className="text-[var(--dark-text-secondary)] font-medium">{String(count)} incidents</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {l.severity_breakdown && Object.keys(l.severity_breakdown).length > 1 && (
                            <div>
                              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-amber)] mb-1.5">Severity Mix</h5>
                              {Object.entries(l.severity_breakdown).map(([sev, count]) => (
                                <div key={sev} className="flex justify-between text-xs py-0.5">
                                  <span className="text-[var(--dark-text-muted)]">{sev}</span>
                                  <span className="text-[var(--dark-text-secondary)] font-medium">{String(count)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Uploaded tab */}
        {activeTab === "uploaded" && (
          <div className="flex flex-col gap-3">
            {anecdotalData && anecdotalData.length > 0 ? (
              filterBySearch(anecdotalData).map((l, i) => (
                <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-xl p-4 hover:border-[var(--dark-border)] transition-colors">
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

        {/* Combined tab */}
        {activeTab === "combined" && (
          <div className="flex flex-col gap-3">
            {filterBySearch(combinedData).map((l, i) => (
              <div key={i} className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-xl p-4 hover:border-[var(--dark-border)] transition-colors">
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
