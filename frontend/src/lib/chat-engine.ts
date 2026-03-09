import staticKpis from "@/data/kpis.json";
import staticFunnel from "@/data/funnel.json";
import staticResolutionQuality from "@/data/resolution-quality.json";
import staticBusinessValue from "@/data/business-value.json";
import staticBenchmark from "@/data/agent-benchmark.json";
import staticSeverity from "@/data/severity.json";
import staticIncidentTypes from "@/data/incident-types.json";
import staticLearnings from "@/data/system-learnings.json";

interface ChatResponse {
  content: string;
  suggestions: string[];
}

interface Learning {
  incident_type: string;
  auto_resolution_rate: number;
  avg_tat: number | null;
  key_insight: string;
  pattern: string;
  resolution_steps?: string[];
  top_routes?: Record<string, number>;
  known_transporters?: Record<string, number>;
  severity_breakdown?: Record<string, number>;
  active_count?: number;
  manual_count?: number;
}

interface Benchmark {
  incident_type: string;
  incidents_handled: number;
  auto_resolution_rate: number;
  avg_resolution_tat: number;
  reopen_rate: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const learnings = staticLearnings as any as Learning[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const benchmarks = staticBenchmark as any as Benchmark[];
const kpis = staticKpis as Record<string, number>;
const funnel = staticFunnel as { stage: string; count: number; pct: number }[];
const quality = staticResolutionQuality as Record<string, number>;
const bizValue = staticBusinessValue as Record<string, unknown>;
const severity = staticSeverity as { severity: string; count: number }[];
const incidentTypes = staticIncidentTypes as { incident_type: string; count: number }[];

function fmt(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtMin(m: number | null): string {
  if (!m) return "N/A";
  if (m < 60) return `${Math.round(m)}min`;
  if (m < 1440) return `${(m / 60).toFixed(1)}h`;
  return `${(m / 1440).toFixed(1)}d`;
}

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

type Intent =
  | "overview" | "best" | "worst" | "active" | "corridor" | "transporter"
  | "resolution" | "improvement" | "business" | "severity" | "funnel"
  | "incident_detail" | "compare" | "greeting" | "unknown";

function classifyIntent(q: string): Intent {
  const l = q.toLowerCase();
  if (/^(hi|hello|hey|good morning|good evening)/.test(l)) return "greeting";
  if (/overview|summary|how.*perform|overall|dashboard|status/.test(l)) return "overview";
  if (/worst|weakest|lowest|struggling|problem|bad|poor|slow/.test(l)) return "worst";
  if (/best|top|highest|strongest|fastest|good/.test(l)) return "best";
  if (/active|unresolved|pending|open|backlog/.test(l)) return "active";
  if (/corridor|route|lane|davangere|chitradurga|bellary|hospet|belgur|yemmiganur/.test(l)) return "corridor";
  if (/transporter|carrier|arn|xpress|journey transporter/.test(l)) return "transporter";
  if (/resolution|quality|tat|time|speed|p90|p50|turnaround/.test(l)) return "resolution";
  if (/improv|tip|suggest|recommend|action|next.*step|what.*should|fix/.test(l)) return "improvement";
  if (/value|cost|saving|roi|money|business|rupee|crore|lakh/.test(l)) return "business";
  if (/severity|critical|high|medium|low/.test(l)) return "severity";
  if (/funnel|stage|flow|pipeline/.test(l)) return "funnel";
  if (/compare|vs|versus|difference/.test(l)) return "compare";

  // Check for specific incident types
  const types = learnings.map(l => l.incident_type);
  for (const t of types) {
    if (l.includes(t) || l.includes(t.replace(/_/g, " "))) return "incident_detail";
  }

  return "unknown";
}

function extractIncidentType(q: string): Learning | null {
  const l = q.toLowerCase();
  for (const learning of learnings) {
    if (l.includes(learning.incident_type) || l.includes(learning.incident_type.replace(/_/g, " "))) {
      return learning;
    }
  }
  return null;
}

function extractCorridor(q: string): string | null {
  const l = q.toLowerCase();
  const keywords = ["davangere", "chitradurga", "bellary", "hospet", "belgur", "yemmiganur", "itigi", "srirampura", "thoolahalli", "hiriyur"];
  for (const kw of keywords) {
    if (l.includes(kw)) return kw;
  }
  return null;
}

function overviewResponse(): ChatResponse {
  return {
    content: `**Agent Performance Overview**

Across **${fmt(kpis.total_incidents)}** incidents:
- **${kpis.auto_resolved_pct}%** auto-resolved by the AI agent
- **${fmt(kpis.critical_incidents)}** classified as critical
- **${kpis.manual_intervention_pct}%** needed manual intervention
- Average resolution TAT: **${fmtMin(kpis.avg_resolution_tat)}**
- P90 TAT: **${fmtMin(kpis.p90_resolution_tat)}**
- AI confidence score: **${kpis.avg_confidence_score}%**
- Value protected: **₹${fmt(kpis.shipment_value_protected)}**
- AI value delivered: **₹${fmt(kpis.ai_value_delivered)}**

The system handles 12 incident types across logistics operations, with tracking_interrupted (${incidentTypes.find(i => i.incident_type === "tracking_interrupted")?.count || 0}) and untracked (${incidentTypes.find(i => i.incident_type === "untracked")?.count || 0}) being the highest volume.`,
    suggestions: ["Which agent is worst?", "Active incidents?", "Improvement tips"],
  };
}

function bestResponse(): ChatResponse {
  const sorted = [...benchmarks].sort((a, b) => b.auto_resolution_rate - a.auto_resolution_rate);
  const top3 = sorted.slice(0, 3);
  return {
    content: `**Top Performing Agents**

${top3.map((b, i) => `${i + 1}. **${label(b.incident_type)}** — ${b.auto_resolution_rate}% auto-resolution, ${fmt(b.incidents_handled)} incidents, ${fmtMin(b.avg_resolution_tat)} avg TAT`).join("\n")}

${label(top3[0].incident_type)} leads with near-perfect auto-resolution. These agents handle their incident types effectively with minimal manual intervention.`,
    suggestions: ["Which is the worst?", "Tell me about " + top3[0].incident_type, "Resolution quality"],
  };
}

function worstResponse(): ChatResponse {
  const sorted = [...benchmarks].sort((a, b) => a.auto_resolution_rate - b.auto_resolution_rate);
  const bottom3 = sorted.slice(0, 3);
  const worstLearning = learnings.find(l => l.incident_type === bottom3[0].incident_type);
  return {
    content: `**Agents Needing Attention**

${bottom3.map((b, i) => `${i + 1}. **${label(b.incident_type)}** — ${b.auto_resolution_rate}% auto-resolution, ${fmt(b.incidents_handled)} incidents, ${fmtMin(b.avg_resolution_tat)} avg TAT`).join("\n")}

**${label(bottom3[0].incident_type)}** is the weakest at ${bottom3[0].auto_resolution_rate}% auto-resolution.${worstLearning?.active_count ? ` ${worstLearning.active_count} incidents remain active — the largest unresolved backlog.` : ""}

${worstLearning?.key_insight ? `**Insight:** ${worstLearning.key_insight}` : ""}`,
    suggestions: ["How to improve " + bottom3[0].incident_type + "?", "Active backlog?", "Top corridors for " + bottom3[0].incident_type],
  };
}

function activeResponse(): ChatResponse {
  const withActive = learnings.filter(l => (l.active_count || 0) > 0).sort((a, b) => (b.active_count || 0) - (a.active_count || 0));
  const totalActive = withActive.reduce((s, l) => s + (l.active_count || 0), 0);
  return {
    content: `**Active Incident Backlog: ${fmt(totalActive)} incidents**

${withActive.map(l => `- **${label(l.incident_type)}**: ${l.active_count} active (${l.auto_resolution_rate}% auto-resolution rate)`).join("\n")}

**Priority action:** Focus on **${label(withActive[0].incident_type)}** which has the largest backlog at ${withActive[0].active_count} unresolved cases. ${withActive[0].key_insight ? withActive[0].key_insight.split(".")[0] + "." : ""}`,
    suggestions: ["How to fix " + withActive[0].incident_type + "?", "Corridor details?", "Performance overview"],
  };
}

function corridorResponse(q: string): ChatResponse {
  const corridor = extractCorridor(q);
  if (!corridor) {
    // Show top corridors across all types
    const allRoutes: Record<string, number> = {};
    for (const l of learnings) {
      if (l.top_routes) {
        for (const [route, count] of Object.entries(l.top_routes)) {
          allRoutes[route] = (allRoutes[route] || 0) + count;
        }
      }
    }
    const sorted = Object.entries(allRoutes).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      content: `**Top Corridors by Incident Volume**

${sorted.map(([route, count], i) => `${i + 1}. **${route}** — ${count} incidents`).join("\n")}

These corridors see the most alerts. Ask about a specific location (e.g., Davangere, Bellary, Chitradurga) for deeper analysis.`,
      suggestions: ["Davangere corridors", "Bellary analysis", "Chitradurga routes"],
    };
  }

  // Find all learnings mentioning this corridor
  const matches: { type: string; route: string; count: number }[] = [];
  for (const l of learnings) {
    if (l.top_routes) {
      for (const [route, count] of Object.entries(l.top_routes)) {
        if (route.toLowerCase().includes(corridor)) {
          matches.push({ type: l.incident_type, route, count });
        }
      }
    }
  }

  if (matches.length === 0) {
    return { content: `No corridor data found matching "${corridor}". Try Davangere, Bellary, or Chitradurga.`, suggestions: ["Top corridors", "Overview"] };
  }

  const totalIncidents = matches.reduce((s, m) => s + m.count, 0);
  const byType: Record<string, number> = {};
  for (const m of matches) byType[m.type] = (byType[m.type] || 0) + m.count;

  return {
    content: `**${corridor.charAt(0).toUpperCase() + corridor.slice(1)} Corridor Analysis**

**${totalIncidents} total incidents** across ${matches.length} routes:

**By incident type:**
${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => `- ${label(type)}: ${count} incidents`).join("\n")}

**Top routes:**
${matches.sort((a, b) => b.count - a.count).slice(0, 5).map(m => `- ${m.route} — ${m.count} (${label(m.type)})`).join("\n")}

**Recommendation:** ${totalIncidents > 100 ? "This is a high-volume corridor. Consider dedicated monitoring, transporter performance reviews, and route-specific SLA adjustments." : "Moderate volume. Monitor trends for escalation patterns."}`,
    suggestions: ["Transporters on this corridor", "Improvement tips", "Compare corridors"],
  };
}

function transporterResponse(): ChatResponse {
  const allTransporters: Record<string, { incidents: number; types: string[] }> = {};
  for (const l of learnings) {
    if (l.known_transporters) {
      for (const [name, count] of Object.entries(l.known_transporters)) {
        if (!allTransporters[name]) allTransporters[name] = { incidents: 0, types: [] };
        allTransporters[name].incidents += count;
        allTransporters[name].types.push(`${label(l.incident_type)} (${count})`);
      }
    }
  }

  const sorted = Object.entries(allTransporters).sort((a, b) => b[1].incidents - a[1].incidents);

  if (sorted.length === 0) {
    return { content: "Most incidents have unknown transporter data. Only long_stoppage incidents have identified transporters.", suggestions: ["Long stoppage details", "Overview"] };
  }

  return {
    content: `**Transporter Analysis**

${sorted.map(([name, data], i) => `${i + 1}. **${name}** — ${data.incidents} incidents
   Types: ${data.types.join(", ")}`).join("\n\n")}

**Key insight:** ARN Transport handles the most identified cases (14 long stoppages). Most incidents (99%+) have "Unknown" transporter — improving transporter ID capture would enable better accountability and performance tracking.

**Next action:** Work with operations to ensure transporter details are captured at journey creation for all shipments.`,
    suggestions: ["Long stoppage details", "Corridor analysis", "Improvement tips"],
  };
}

function resolutionResponse(): ChatResponse {
  return {
    content: `**Resolution Quality Metrics**

- Auto-resolution rate: **${quality.auto_resolution_success_rate}%**
- Escalation rate: **${quality.escalation_rate}%**
- Reopen rate: **${quality.reopen_rate}%**
- False positive rate: **${quality.false_positive_rate}%**
- P50 resolution time: **${fmtMin(quality.p50_resolution_time)}** (half resolved within this)
- P90 resolution time: **${fmtMin(quality.p90_resolution_time)}** (90% resolved within this)

**By agent speed:**
${[...benchmarks].sort((a, b) => a.avg_resolution_tat - b.avg_resolution_tat).slice(0, 5).map(b => `- ${label(b.incident_type)}: ${fmtMin(b.avg_resolution_tat)} avg TAT`).join("\n")}

**Fastest:** Route deviation (median 33min). **Slowest:** Untracked (avg 33h).`,
    suggestions: ["How to improve TAT?", "Worst performing?", "Active incidents"],
  };
}

function improvementResponse(): ChatResponse {
  const actions: string[] = [];

  // Find types with low auto-resolution
  const lowAuto = [...benchmarks].filter(b => b.auto_resolution_rate < 80).sort((a, b) => a.auto_resolution_rate - b.auto_resolution_rate);
  if (lowAuto.length > 0) {
    actions.push(`**1. Fix low auto-resolution agents:**\n${lowAuto.map(b => `   - ${label(b.incident_type)} at ${b.auto_resolution_rate}% — ${learnings.find(l => l.incident_type === b.incident_type)?.key_insight?.split(".")[0] || "Needs investigation"}`).join("\n")}`);
  }

  // Find types with high active count
  const highActive = learnings.filter(l => (l.active_count || 0) > 50).sort((a, b) => (b.active_count || 0) - (a.active_count || 0));
  if (highActive.length > 0) {
    actions.push(`**2. Clear active backlogs:**\n${highActive.map(l => `   - ${label(l.incident_type)}: ${l.active_count} pending — add escalation timers and auto-close rules`).join("\n")}`);
  }

  // Transporter data gap
  actions.push("**3. Close transporter data gap:** 99%+ incidents have unknown transporter. Mandate transporter ID capture at journey creation for accountability tracking.");

  // Corridor-specific
  actions.push("**4. Corridor interventions:** Davangere-STO and Chitradurga-STO corridors account for the highest incident volumes across multiple types. Deploy corridor-specific monitoring dashboards and SLA adjustments.");

  // Confidence scores
  actions.push(`**5. Improve AI confidence:** Current avg confidence is ${kpis.avg_confidence_score}%. Enrich data completeness (GPS, transporter info) to boost model accuracy.`);

  return {
    content: `**Next Best Actions — Prioritised**

${actions.join("\n\n")}

These actions are ranked by potential impact. Fixing untracked auto-resolution alone would clear 2,123 pending cases.`,
    suggestions: ["Untracked deep-dive", "Corridor details", "Transporter info"],
  };
}

function businessResponse(): ChatResponse {
  const bv = bizValue as { risk_avoided: { shipment_value_protected: number }; cost_avoided: { penalty_avoided: number; delay_cost_avoided: number; detention_avoided: number; total: number }; productivity_gain: { manual_hours_saved: number; calls_avoided: number; value: number }; ai_value_delivered: number };
  return {
    content: `**Business Value Summary**

**Total AI Value Delivered: ₹${fmt(bv.ai_value_delivered)}**

- **Risk avoided:** ₹${fmt(bv.risk_avoided.shipment_value_protected)} in shipment value protected
- **Cost avoided:** ₹${fmt(bv.cost_avoided.total)}
  - Penalty: ₹${fmt(bv.cost_avoided.penalty_avoided)}
  - Delay: ₹${fmt(bv.cost_avoided.delay_cost_avoided)}
  - Detention: ₹${fmt(bv.cost_avoided.detention_avoided)}
- **Productivity gain:** ₹${fmt(bv.productivity_gain.value)}
  - ${fmt(bv.productivity_gain.manual_hours_saved)} hours saved
  - ${fmt(bv.productivity_gain.calls_avoided)} calls avoided

**KPI highlight:** AI auto-resolved ${kpis.auto_resolved_pct}% of ${fmt(kpis.total_incidents)} incidents, each saving ~15 min of operator time.`,
    suggestions: ["How to increase value?", "Performance overview", "Improvement tips"],
  };
}

function severityResponse(): ChatResponse {
  const total = severity.reduce((s, d) => s + d.count, 0);
  return {
    content: `**Severity Distribution**

${severity.map(s => `- **${s.severity}**: ${fmt(s.count)} incidents (${(s.count / total * 100).toFixed(1)}%)`).join("\n")}

**Key finding:** ${severity[0]?.severity === "CRITICAL" ? `${(severity[0].count / total * 100).toFixed(0)}% of all incidents are CRITICAL. The AI agent still achieves ${kpis.auto_resolved_pct}% auto-resolution even at this severity level.` : "Most incidents are concentrated in the highest severity levels."}

Almost all incident types (tracking_interrupted, untracked, detention, route_deviation, etc.) are uniformly classified as CRITICAL. Only long_stoppage has a mixed severity distribution (MEDIUM: 438, CRITICAL: 282, HIGH: 43, LOW: 6).`,
    suggestions: ["Long stoppage severity details", "Critical incident breakdown", "Resolution quality"],
  };
}

function funnelResponse(): ChatResponse {
  return {
    content: `**Incident Funnel**

${funnel.map(s => `- **${s.stage}**: ${fmt(s.count)} (${s.pct}%)`).join("\n")}

The funnel shows incidents flowing from detection through qualification, prioritisation, and resolution. The auto-resolved stage at ${funnel.find(s => s.stage === "Auto Resolved")?.pct || 0}% demonstrates strong AI capability.`,
    suggestions: ["Resolution quality", "Active incidents", "Performance overview"],
  };
}

function incidentDetailResponse(q: string): ChatResponse {
  const learning = extractIncidentType(q);
  if (!learning) {
    return { content: "I couldn't identify the incident type. Available types: " + learnings.map(l => label(l.incident_type)).join(", "), suggestions: ["Overview", "Best performing"] };
  }

  const bench = benchmarks.find(b => b.incident_type === learning.incident_type);
  const routes = learning.top_routes ? Object.entries(learning.top_routes).sort((a, b) => b[1] - a[1]) : [];
  const transporters = learning.known_transporters ? Object.entries(learning.known_transporters) : [];

  return {
    content: `**${label(learning.incident_type)} — Deep Dive**

**Volume:** ${bench?.incidents_handled || 0} incidents
**Auto-resolution:** ${learning.auto_resolution_rate}%
**Avg TAT:** ${fmtMin(learning.avg_tat)}${learning.active_count ? `\n**Still active:** ${learning.active_count}` : ""}${learning.manual_count ? `\n**Manual interventions:** ${learning.manual_count}` : ""}

**Pattern:** ${learning.pattern}

**Insight:** ${learning.key_insight}

${learning.resolution_steps && learning.resolution_steps.length > 0 ? `**Resolution pathway:**\n${learning.resolution_steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : ""}

${routes.length > 0 ? `**Top corridors:**\n${routes.slice(0, 3).map(([r, c]) => `- ${r} (${c} incidents)`).join("\n")}` : ""}

${transporters.length > 0 ? `**Known transporters:** ${transporters.map(([n, c]) => `${n} (${c})`).join(", ")}` : ""}

${learning.severity_breakdown && Object.keys(learning.severity_breakdown).length > 1 ? `**Severity mix:** ${Object.entries(learning.severity_breakdown).map(([s, c]) => `${s}: ${c}`).join(", ")}` : ""}`,
    suggestions: ["How to improve " + learning.incident_type + "?", "Compare with other agents", "Corridors for this type"],
  };
}

function compareResponse(q: string): ChatResponse {
  // Try to find two incident types
  const found: Learning[] = [];
  for (const l of learnings) {
    if (q.toLowerCase().includes(l.incident_type) || q.toLowerCase().includes(l.incident_type.replace(/_/g, " "))) {
      found.push(l);
    }
  }

  if (found.length < 2) {
    // Compare top 2 by volume
    const sorted = [...benchmarks].sort((a, b) => b.incidents_handled - a.incidents_handled);
    const b1 = sorted[0], b2 = sorted[1];
    const l1 = learnings.find(l => l.incident_type === b1.incident_type)!;
    const l2 = learnings.find(l => l.incident_type === b2.incident_type)!;

    return {
      content: `**Comparison: ${label(b1.incident_type)} vs ${label(b2.incident_type)}**

| Metric | ${label(b1.incident_type)} | ${label(b2.incident_type)} |
|---|---|---|
| Incidents | ${b1.incidents_handled} | ${b2.incidents_handled} |
| Auto-resolution | ${b1.auto_resolution_rate}% | ${b2.auto_resolution_rate}% |
| Avg TAT | ${fmtMin(b1.avg_resolution_tat)} | ${fmtMin(b2.avg_resolution_tat)} |
| Active | ${l1?.active_count || 0} | ${l2?.active_count || 0} |

**${label(b1.incident_type)}** has higher volume but ${b1.auto_resolution_rate > b2.auto_resolution_rate ? "better" : "worse"} auto-resolution. ${label(b2.incident_type)} ${b2.avg_resolution_tat < b1.avg_resolution_tat ? "resolves faster" : "takes longer to resolve"}.`,
      suggestions: [`${b1.incident_type} details`, `${b2.incident_type} details`, "Best performing"],
    };
  }

  const b1 = benchmarks.find(b => b.incident_type === found[0].incident_type)!;
  const b2 = benchmarks.find(b => b.incident_type === found[1].incident_type)!;

  return {
    content: `**Comparison: ${label(found[0].incident_type)} vs ${label(found[1].incident_type)}**

| Metric | ${label(found[0].incident_type)} | ${label(found[1].incident_type)} |
|---|---|---|
| Incidents | ${b1?.incidents_handled || 0} | ${b2?.incidents_handled || 0} |
| Auto-resolution | ${found[0].auto_resolution_rate}% | ${found[1].auto_resolution_rate}% |
| Avg TAT | ${fmtMin(found[0].avg_tat)} | ${fmtMin(found[1].avg_tat)} |
| Active | ${found[0].active_count || 0} | ${found[1].active_count || 0} |`,
    suggestions: [`${found[0].incident_type} details`, `${found[1].incident_type} details`, "Improvement tips"],
  };
}

function greetingResponse(): ChatResponse {
  return {
    content: `Hello! I'm the **Agent Performance Assistant**. I can help you understand how the AI agents are performing across ${fmt(kpis.total_incidents)} logistics incidents.

**Here's what I can tell you about:**
- Agent performance and comparisons
- Corridor and route-level insights
- Transporter analysis
- Active incident backlogs
- Improvement recommendations
- Business value and ROI

What would you like to know?`,
    suggestions: ["Performance overview", "Worst performing agent?", "Next best actions", "Corridor analysis"],
  };
}

function unknownResponse(): ChatResponse {
  return {
    content: "I can help with **agent performance**, **incident analysis**, **corridor insights**, **transporter info**, and **improvement recommendations**. Try asking about a specific incident type, corridor, or for improvement tips.",
    suggestions: ["Performance overview", "Improvement tips", "Corridor analysis", "Transporter info"],
  };
}

export function processQuery(query: string): ChatResponse {
  const intent = classifyIntent(query);

  switch (intent) {
    case "greeting": return greetingResponse();
    case "overview": return overviewResponse();
    case "best": return bestResponse();
    case "worst": return worstResponse();
    case "active": return activeResponse();
    case "corridor": return corridorResponse(query);
    case "transporter": return transporterResponse();
    case "resolution": return resolutionResponse();
    case "improvement": return improvementResponse();
    case "business": return businessResponse();
    case "severity": return severityResponse();
    case "funnel": return funnelResponse();
    case "incident_detail": return incidentDetailResponse(query);
    case "compare": return compareResponse(query);
    default: return unknownResponse();
  }
}
