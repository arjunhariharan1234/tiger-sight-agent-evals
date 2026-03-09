"use client";

import SectionCard from "@/components/ui/SectionCard";
import DataTable from "@/components/ui/DataTable";
import type { AgentBenchmark as AgentBenchmarkData } from "@/lib/api";
import { formatNumber, formatMinutes, formatPercent, incidentLabel } from "@/lib/format";

interface Props {
  data: AgentBenchmarkData[] | null;
  loading: boolean;
}

export default function AgentBenchmark({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Agent Benchmark" accent="purple" description="Per-incident-type performance metrics — incidents handled, auto-resolution rate, average TAT, and reopen rate for each category.">
        <div className="p-5"><div className="shimmer h-[300px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  const columns = [
    { key: "incident_type", title: "Incident Type" },
    { key: "incidents_handled", title: "Incidents" },
    { key: "auto_resolution_rate", title: "Auto Resolution %" },
    { key: "avg_resolution_tat", title: "Avg TAT" },
    { key: "reopen_rate", title: "Reopen Rate" },
  ];

  const rows = data.map((row, idx) => ({
    id: String(idx),
    incident_type: incidentLabel(row.incident_type),
    incidents_handled: formatNumber(row.incidents_handled),
    auto_resolution_rate: formatPercent(row.auto_resolution_rate),
    avg_resolution_tat: formatMinutes(row.avg_resolution_tat),
    reopen_rate: formatPercent(row.reopen_rate),
  }));

  return (
    <SectionCard title="Agent Benchmark — Control Tower" accent="purple" description="Per-incident-type performance metrics — incidents handled, auto-resolution rate, average TAT, and reopen rate for each category.">
      <div className="p-5">
        <DataTable columns={columns} data={rows} />
      </div>
    </SectionCard>
  );
}
