"use client";

import { useState, useCallback } from "react";
import { useFilters, useFetch } from "@/lib/hooks";
import {
  getKPIs,
  getFunnel,
  getResolutionQuality,
  getBusinessValue,
  getAgentBenchmark,
  getSeverityDistribution,
  getIncidentTypes,
  getTimeline,
  getSystemLearnings,
  getAnecdotalLearnings,
  getCombinedLearnings,
} from "@/lib/api";

import GlobalFilters from "@/components/filters/GlobalFilters";
import KPIStrip from "@/components/KPIStrip";
import IncidentFunnel from "@/components/IncidentFunnel";
import ResolutionQualityPanel from "@/components/ResolutionQualityPanel";
import BusinessValuePanel from "@/components/BusinessValuePanel";
import AgentBenchmarkView from "@/components/AgentBenchmark";
import SemanticLearnings from "@/components/SemanticLearnings";
import ImprovementPanel from "@/components/ImprovementPanel";
import TransactionDrilldown from "@/components/TransactionDrilldown";
import LearningUpload from "@/components/LearningUpload";
import LongStoppageLearnings from "@/components/LongStoppageLearnings";
import TimelineChart from "@/components/charts/TimelineChart";
import SeverityChart from "@/components/charts/SeverityChart";
import IncidentTypeChart from "@/components/charts/IncidentTypeChart";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "business", label: "Business Value" },
  { key: "learnings", label: "Learnings" },
  { key: "transactions", label: "Transactions" },
];

export default function DashboardPage() {
  const { filters, updateFilter, clearFilters } = useFilters();
  const [isInternal, setIsInternal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const kpiFetcher = useCallback(getKPIs, []);
  const funnelFetcher = useCallback(getFunnel, []);
  const qualityFetcher = useCallback(getResolutionQuality, []);
  const valueFetcher = useCallback(getBusinessValue, []);
  const benchmarkFetcher = useCallback(getAgentBenchmark, []);
  const severityFetcher = useCallback(getSeverityDistribution, []);
  const incidentTypeFetcher = useCallback(getIncidentTypes, []);
  const timelineFetcher = useCallback(getTimeline, []);
  const systemLearningsFetcher = useCallback(getSystemLearnings, []);
  const combinedLearningsFetcher = useCallback(getCombinedLearnings, []);
  const anecdotalFetcher = useCallback(getAnecdotalLearnings, []);

  const kpis = useFetch(kpiFetcher, filters);
  const funnel = useFetch(funnelFetcher, filters);
  const quality = useFetch(qualityFetcher, filters);
  const value = useFetch(valueFetcher, filters);
  const benchmark = useFetch(benchmarkFetcher, filters);
  const severity = useFetch(severityFetcher, filters);
  const incidentTypes = useFetch(incidentTypeFetcher, filters);
  const timeline = useFetch(timelineFetcher, filters);
  const systemLearnings = useFetch(systemLearningsFetcher, filters);
  const combinedLearnings = useFetch(combinedLearningsFetcher, filters);
  const anecdotalLearnings = useFetch(anecdotalFetcher);

  const tabs = isInternal
    ? [...TABS, { key: "improvements", label: "Improvements" }]
    : TABS;

  return (
    <div className="min-h-screen bg-[var(--dark-bg)] text-[var(--dark-text)]">
      {/* Header */}
      <header className="border-b border-[var(--dark-border)] bg-[var(--dark-surface)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffbe07] to-[#f59e0b] flex items-center justify-center shadow-[0_0_16px_rgba(255,190,7,0.3)]">
              <svg className="w-5 h-5 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#ffbe07]">
                Agent Performance
              </h1>
              <p className="text-xs text-[var(--dark-text-muted)]">Control Tower — AI Evaluation Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-[var(--dark-text-muted)]">Internal View</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-[var(--dark-border)] peer-checked:bg-[#ffbe07] transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <GlobalFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
          />
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] shadow-[0_0_12px_rgba(255,190,7,0.15)]"
                  : "text-[var(--dark-text-muted)] hover:text-[var(--dark-text-secondary)] hover:bg-[var(--dark-card)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <KPIStrip data={kpis.data} loading={kpis.loading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncidentFunnel data={funnel.data} loading={funnel.loading} />
              <ResolutionQualityPanel data={quality.data} loading={quality.loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimelineChart data={timeline.data} loading={timeline.loading} />
              <SeverityChart data={severity.data} loading={severity.loading} />
            </div>

            <IncidentTypeChart data={incidentTypes.data} loading={incidentTypes.loading} />
          </div>
        )}

        {activeTab === "business" && (
          <div className="flex flex-col gap-6">
            <BusinessValuePanel data={value.data} loading={value.loading} />
            <AgentBenchmarkView data={benchmark.data} loading={benchmark.loading} />
          </div>
        )}

        {activeTab === "learnings" && (
          <div className="flex flex-col gap-6">
            <LongStoppageLearnings />
            <SemanticLearnings
              systemData={systemLearnings.data}
              combinedData={combinedLearnings.data}
              anecdotalData={anecdotalLearnings.data}
              loading={systemLearnings.loading}
            />
            <LearningUpload />
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <TransactionDrilldown filters={filters} isInternal={isInternal} />
          </div>
        )}

        {activeTab === "improvements" && isInternal && (
          <div>
            <ImprovementPanel visible={isInternal} />
          </div>
        )}
      </main>
    </div>
  );
}
