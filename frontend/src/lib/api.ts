const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Static fallback data (precomputed from backend)
import staticKpis from "@/data/kpis.json";
import staticFunnel from "@/data/funnel.json";
import staticResolutionQuality from "@/data/resolution-quality.json";
import staticBusinessValue from "@/data/business-value.json";
import staticAgentBenchmark from "@/data/agent-benchmark.json";
import staticSeverity from "@/data/severity.json";
import staticIncidentTypes from "@/data/incident-types.json";
import staticTimeline from "@/data/timeline.json";
import staticSystemLearnings from "@/data/system-learnings.json";
import staticAnecdotalLearnings from "@/data/anecdotal-learnings.json";
import staticCombinedLearnings from "@/data/combined-learnings.json";
import staticFilterOptions from "@/data/filter-options.json";
import staticTransactions from "@/data/transactions.json";

const STATIC_MAP: Record<string, unknown> = {
  "/api/kpis": staticKpis,
  "/api/funnel": staticFunnel,
  "/api/resolution-quality": staticResolutionQuality,
  "/api/business-value": staticBusinessValue,
  "/api/agent-benchmark": staticAgentBenchmark,
  "/api/charts/severity": staticSeverity,
  "/api/charts/incident-types": staticIncidentTypes,
  "/api/charts/timeline": staticTimeline,
  "/api/learnings/system": staticSystemLearnings,
  "/api/learnings/anecdotal": staticAnecdotalLearnings,
  "/api/learnings/combined": staticCombinedLearnings,
  "/api/filters/options": staticFilterOptions,
};

export interface Filters {
  date_from?: string;
  date_to?: string;
  company?: string;
  incident_type?: string;
  severity?: string;
  status?: string;
  corridor?: string;
  confidence_min?: number;
  confidence_max?: number;
}

function buildParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

async function fetchApi<T>(endpoint: string, filters: Filters = {}): Promise<T> {
  const params = buildParams(filters);
  const url = `${API_BASE}${endpoint}${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch {
    // Fallback to static data when backend is unavailable
    const hasFilters = params.toString().length > 0;
    if (!hasFilters && STATIC_MAP[endpoint] !== undefined) {
      return STATIC_MAP[endpoint] as T;
    }
    // For filtered requests, still return unfiltered static data as best-effort
    if (STATIC_MAP[endpoint] !== undefined) {
      return STATIC_MAP[endpoint] as T;
    }
    throw new Error(`Backend unavailable and no static fallback for ${endpoint}`);
  }
}

// KPIs
export interface KPIs {
  total_incidents: number;
  critical_incidents: number;
  auto_resolved_pct: number;
  manual_intervention_pct: number;
  avg_resolution_tat: number;
  p90_resolution_tat: number;
  shipment_value_protected: number;
  ai_value_delivered: number;
  avg_confidence_score: number;
}

export const getKPIs = (filters?: Filters) => fetchApi<KPIs>("/api/kpis", filters);

// Funnel
export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export const getFunnel = (filters?: Filters) => fetchApi<FunnelStage[]>("/api/funnel", filters);

// Resolution Quality
export interface ResolutionQuality {
  auto_resolution_success_rate: number;
  escalation_rate: number;
  reopen_rate: number;
  false_positive_rate: number;
  p50_resolution_time: number;
  p90_resolution_time: number;
}

export const getResolutionQuality = (filters?: Filters) =>
  fetchApi<ResolutionQuality>("/api/resolution-quality", filters);

// Business Value
export interface BusinessValue {
  risk_avoided: { shipment_value_protected: number };
  cost_avoided: {
    penalty_avoided: number;
    delay_cost_avoided: number;
    detention_avoided: number;
    total: number;
  };
  productivity_gain: {
    manual_hours_saved: number;
    calls_avoided: number;
    value: number;
  };
  ai_value_delivered: number;
}

export const getBusinessValue = (filters?: Filters) =>
  fetchApi<BusinessValue>("/api/business-value", filters);

// Agent Benchmark
export interface AgentBenchmark {
  agent_type: string;
  incident_type: string;
  incidents_handled: number;
  auto_resolution_rate: number;
  avg_resolution_tat: number;
  reopen_rate: number;
}

export const getAgentBenchmark = (filters?: Filters) =>
  fetchApi<AgentBenchmark[]>("/api/agent-benchmark", filters);

// Charts
export interface SeverityItem {
  severity: string;
  count: number;
}

export interface IncidentTypeItem {
  incident_type: string;
  count: number;
}

export interface TimelineItem {
  date: string;
  total: number;
  auto_resolved: number;
  critical: number;
}

export interface CorridorItem {
  corridor: string;
  incidents: number;
  auto_resolved: number;
  avg_tat: number;
}

export const getSeverityDistribution = (filters?: Filters) =>
  fetchApi<SeverityItem[]>("/api/charts/severity", filters);

export const getIncidentTypes = (filters?: Filters) =>
  fetchApi<IncidentTypeItem[]>("/api/charts/incident-types", filters);

export const getTimeline = (filters?: Filters) =>
  fetchApi<TimelineItem[]>("/api/charts/timeline", filters);

export const getCorridors = (filters?: Filters) =>
  fetchApi<CorridorItem[]>("/api/charts/corridors", filters);

// Learnings
export interface SystemLearning {
  incident_type: string;
  agent_type: string;
  pattern: string;
  auto_resolution_rate: number;
  avg_tat: number | null;
  key_insight: string;
  source: string;
}

export interface CombinedLearning extends SystemLearning {
  source: string;
}

export const getSystemLearnings = (filters?: Filters) =>
  fetchApi<SystemLearning[]>("/api/learnings/system", filters);

export const getAnecdotalLearnings = () =>
  fetchApi<Record<string, unknown>[]>("/api/learnings/anecdotal");

export const getCombinedLearnings = (filters?: Filters) =>
  fetchApi<CombinedLearning[]>("/api/learnings/combined", filters);

// Upload
export async function uploadLearnings(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/learnings/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function validateUpload(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/learnings/upload/validate`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Validation failed: ${res.status}`);
  return res.json();
}

// Transactions
export interface Transaction {
  id: string;
  alert_id: string;
  alert_name: string;
  alert_text: string;
  status: string;
  severity: string;
  resolution_tat_minutes: number | null;
  computed_confidence_score: number | null;
  performance_summary: string | null;
  company_name: string | null;
  route: string | null;
  location: string | null;
  alert_generated_at: string;
  alert_updated_at: string;
  is_auto_resolved: boolean;
  semantic_learning?: string;
  improvement_suggestions?: string;
  confidence_assessment?: string;
  evaluation_source?: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function getTransactions(
  filters: Filters & { page?: number; page_size?: number; search?: string; internal?: boolean } = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const url = `${API_BASE}/api/transactions?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<TransactionsResponse>;
  } catch {
    return staticTransactions as unknown as TransactionsResponse;
  }
}

// Filter Options
export interface FilterOptions {
  companies: string[];
  incident_types: string[];
  severities: string[];
  statuses: string[];
  corridors: string[];
}

export const getFilterOptions = () => fetchApi<FilterOptions>("/api/filters/options");

// Health
export interface HealthStatus {
  status: string;
  dataset_loaded: boolean;
  total_records: number;
  load_time: number;
  eval_time: number;
}

export const getHealth = () => fetchApi<HealthStatus>("/api/system/health");
