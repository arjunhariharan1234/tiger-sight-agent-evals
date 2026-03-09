"use client";

import { useState, useEffect, useCallback } from "react";
import SectionCard from "@/components/ui/SectionCard";
import DataTable from "@/components/ui/DataTable";
import type { Filters, Transaction, TransactionsResponse } from "@/lib/api";
import { getTransactions } from "@/lib/api";
import { formatDate, formatMinutes, incidentLabel } from "@/lib/format";

interface Props {
  filters: Filters;
  isInternal: boolean;
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  HIGH: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  MEDIUM: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  LOW: "bg-green-500/15 text-green-400 border-green-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  "AUTO RESOLVED": "bg-green-500/15 text-green-400 border-green-500/30",
  "RESOLVED": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "ACTIVE": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function TransactionDrilldown({ filters, isInternal }: Props) {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getTransactions({ ...filters, page, page_size: 15, search, internal: isInternal })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page, search, isInternal]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filters, search]);

  const columns = [
    { key: "alert_name", title: "Incident Type" },
    { key: "severity", title: "Severity" },
    { key: "status", title: "Status" },
    { key: "company_name", title: "Customer" },
    { key: "resolution_tat", title: "Resolution TAT" },
    { key: "confidence", title: "Confidence" },
    { key: "generated_at", title: "Created" },
  ];

  const rows = (data?.data || []).map((t) => ({
    id: t.id,
    alert_name: incidentLabel(t.alert_name),
    severity: t.severity,
    status: t.status.replace(/_/g, " "),
    company_name: t.company_name || "—",
    resolution_tat: formatMinutes(t.resolution_tat_minutes),
    confidence: t.computed_confidence_score ? `${t.computed_confidence_score.toFixed(0)}%` : "—",
    generated_at: formatDate(t.alert_generated_at),
    _raw: t,
  }));

  return (
    <>
      <SectionCard title="Transaction Drilldown" accent="cyan" description="Individual incident records with full detail — click any row to see AI performance summary, resolution details, and confidence assessment.">
        <div className="p-5">
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search by ID, route, or text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg text-sm text-[var(--dark-text)] placeholder:text-[var(--dark-text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]/30 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="shimmer h-[400px] rounded-lg" />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={rows}
                onRowClick={(row) => {
                  const rawRow = row as (typeof rows)[number];
                  setSelected(rawRow._raw as Transaction);
                }}
              />
              {data && data.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[var(--dark-text-muted)]">
                    {data.total.toLocaleString()} results - Page {data.page} of {data.total_pages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-xs rounded-md bg-[var(--dark-surface)] border border-[var(--dark-border)] text-[var(--dark-text-secondary)] hover:bg-[var(--dark-card-hover)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                      disabled={page >= data.total_pages}
                      className="px-3 py-1.5 text-xs rounded-md bg-[var(--dark-surface)] border border-[var(--dark-border)] text-[var(--dark-text-secondary)] hover:bg-[var(--dark-card-hover)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-[var(--dark-surface)] border-l border-[var(--dark-border)] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--dark-surface)] border-b border-[var(--dark-border)]">
              <h3 className="text-base font-semibold text-[var(--dark-text)]">Transaction Detail</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-md hover:bg-[var(--dark-card-hover)] transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-[var(--dark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${SEVERITY_BADGE[selected.severity] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                  {selected.severity}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE[selected.status.replace(/_/g, " ")] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                  {selected.status.replace(/_/g, " ")}
                </span>
              </div>

              <DetailRow label="Incident ID" value={selected.id} mono />
              <DetailRow label="Type" value={incidentLabel(selected.alert_name)} />
              <DetailRow label="Description" value={selected.alert_text} />
              <DetailRow label="Customer" value={selected.company_name || "—"} />
              <DetailRow label="Route" value={selected.route || "—"} />
              <DetailRow label="Location" value={selected.location || "—"} />
              <DetailRow label="Resolution TAT" value={formatMinutes(selected.resolution_tat_minutes)} highlight />
              <DetailRow label="Confidence" value={selected.computed_confidence_score ? `${selected.computed_confidence_score.toFixed(1)}%` : "—"} highlight />
              <DetailRow label="Created" value={formatDate(selected.alert_generated_at)} />
              <DetailRow label="Updated" value={formatDate(selected.alert_updated_at)} />

              <div className="mt-2 p-4 rounded-lg bg-[var(--dark-card)] border border-[var(--dark-border-subtle)]">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[var(--accent-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">AI Performance Summary</span>
                </div>
                <p className="text-sm text-[var(--dark-text-secondary)] leading-relaxed">{selected.performance_summary || "—"}</p>
              </div>

              {isInternal && (
                <>
                  <div className="p-4 rounded-lg bg-[var(--accent-purple-dim)] border border-[var(--accent-purple)]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[var(--accent-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-purple)]">Semantic Learning</span>
                    </div>
                    <p className="text-sm text-[var(--dark-text-secondary)] leading-relaxed">{selected.semantic_learning || "—"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--accent-green-dim)] border border-[var(--accent-green)]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[var(--accent-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-green)]">Improvements</span>
                    </div>
                    <p className="text-sm text-[var(--dark-text-secondary)] leading-relaxed">{selected.improvement_suggestions || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--dark-text-muted)]">Confidence:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selected.confidence_assessment === "HIGH" ? "bg-green-500/15 text-green-400" :
                      selected.confidence_assessment === "MEDIUM" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"
                    }`}>{selected.confidence_assessment || "—"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--dark-text-muted)]">{label}</span>
      <p className={`text-sm mt-0.5 ${highlight ? "text-[var(--accent-cyan)] font-semibold" : "text-[var(--dark-text-secondary)]"} ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
