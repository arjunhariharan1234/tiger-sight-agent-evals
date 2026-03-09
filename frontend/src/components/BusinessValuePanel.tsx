"use client";

import SectionCard from "@/components/ui/SectionCard";
import type { BusinessValue } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

interface Props {
  data: BusinessValue | null;
  loading: boolean;
}

export default function BusinessValuePanel({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SectionCard title="Business Value" accent="green" description="Total monetary impact of the AI system — shipment value protected, penalties and delay costs avoided, and operator productivity gains.">
        <div className="p-5"><div className="shimmer h-[250px] rounded-lg" /></div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Business Value" accent="green" description="Total monetary impact of the AI system — shipment value protected, penalties and delay costs avoided, and operator productivity gains.">
      <div className="p-5">
        {/* Hero Value */}
        <div className="text-center mb-6 py-4 bg-[var(--dark-surface)] rounded-xl border border-[var(--dark-border-subtle)]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--dark-text-muted)] mb-1">Total AI Value Delivered</div>
          <div className="text-4xl font-bold gradient-text">{formatCurrency(data.ai_value_delivered)}</div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[var(--accent-green)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            <span className="text-sm font-medium">AI-Powered Savings</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk Avoided */}
          <div className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-green)]">Risk Avoided</h4>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--dark-text-muted)]">Shipment Value</span>
              <span className="text-sm font-semibold text-[var(--dark-text)]">{formatCurrency(data.risk_avoided.shipment_value_protected)}</span>
            </div>
          </div>

          {/* Cost Avoided */}
          <div className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">Cost Avoided</h4>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between"><span className="text-sm text-[var(--dark-text-muted)]">Penalty</span><span className="text-sm text-[var(--dark-text-secondary)]">{formatCurrency(data.cost_avoided.penalty_avoided)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-[var(--dark-text-muted)]">Delay</span><span className="text-sm text-[var(--dark-text-secondary)]">{formatCurrency(data.cost_avoided.delay_cost_avoided)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-[var(--dark-text-muted)]">Detention</span><span className="text-sm text-[var(--dark-text-secondary)]">{formatCurrency(data.cost_avoided.detention_avoided)}</span></div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[var(--dark-border-subtle)]">
                <span className="text-sm font-semibold text-[var(--dark-text)]">Total</span>
                <span className="text-sm font-semibold text-[var(--accent-cyan)]">{formatCurrency(data.cost_avoided.total)}</span>
              </div>
            </div>
          </div>

          {/* Productivity */}
          <div className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-purple)]">Productivity</h4>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between"><span className="text-sm text-[var(--dark-text-muted)]">Hours Saved</span><span className="text-sm text-[var(--dark-text-secondary)]">{data.productivity_gain.manual_hours_saved}h</span></div>
              <div className="flex justify-between"><span className="text-sm text-[var(--dark-text-muted)]">Calls Avoided</span><span className="text-sm text-[var(--dark-text-secondary)]">{formatNumber(data.productivity_gain.calls_avoided)}</span></div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[var(--dark-border-subtle)]">
                <span className="text-sm font-semibold text-[var(--dark-text)]">Value</span>
                <span className="text-sm font-semibold text-[var(--accent-purple)]">{formatCurrency(data.productivity_gain.value)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
