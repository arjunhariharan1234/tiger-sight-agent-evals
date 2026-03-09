"use client";

import { useEffect, useState } from "react";
import type { Filters, FilterOptions } from "@/lib/api";
import { getFilterOptions } from "@/lib/api";

interface Props {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string | number | undefined) => void;
  onClear: () => void;
}

function FilterChip({
  label,
  active,
  options,
  value,
  onChange,
}: {
  label: string;
  active: boolean;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
          border cursor-pointer
          ${active
            ? "bg-[var(--accent-primary-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_12px_rgba(255,190,7,0.2)]"
            : "bg-[var(--dark-card)] border-[var(--dark-border)] text-[var(--dark-text-secondary)] hover:border-[var(--dark-text-muted)] hover:text-[var(--dark-text)]"
          }
        `}
      >
        <span>{active ? options.find(o => o.value === value)?.label || label : label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-50 min-w-[220px] max-h-[300px] overflow-y-auto bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl shadow-xl shadow-black/40">
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--dark-card-hover)] rounded-t-xl ${!value ? "text-[var(--accent-primary)]" : "text-[var(--dark-text-secondary)]"}`}
            >
              All {label.replace("All ", "")}
            </button>
            {options.map((opt, idx) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--dark-card-hover)] ${idx === options.length - 1 ? "rounded-b-xl" : ""} ${value === opt.value ? "text-[var(--accent-primary)] bg-[var(--accent-primary-dim)]" : "text-[var(--dark-text-secondary)]"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GlobalFilters({ filters, onFilterChange, onClear }: Props) {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    getFilterOptions().then(setOptions).catch(console.error);
  }, []);

  if (!options) return null;

  const activeCount = Object.keys(filters).length;
  const hasDateFilter = !!(filters.date_from || filters.date_to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--dark-text-muted)]">Filters</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)] text-[var(--dark-bg)] text-xs font-bold">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--accent-red)] hover:text-red-400 transition-colors font-medium cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Agents"
          active={!!filters.incident_type}
          value={filters.incident_type || ""}
          options={options.incident_types.map((t) => ({
            label: t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            value: t,
          }))}
          onChange={(val) => onFilterChange("incident_type", val || undefined)}
        />
        <FilterChip
          label="Severity"
          active={!!filters.severity}
          value={filters.severity || ""}
          options={options.severities.map((s) => ({ label: s, value: s }))}
          onChange={(val) => onFilterChange("severity", val || undefined)}
        />
        <FilterChip
          label="Status"
          active={!!filters.status}
          value={filters.status || ""}
          options={options.statuses.map((s) => ({ label: s.replace(/_/g, " "), value: s }))}
          onChange={(val) => onFilterChange("status", val || undefined)}
        />

        {/* Date filter under a click */}
        <div className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              border cursor-pointer
              ${hasDateFilter
                ? "bg-[var(--accent-primary-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_12px_rgba(255,190,7,0.2)]"
                : "bg-[var(--dark-card)] border-[var(--dark-border)] text-[var(--dark-text-secondary)] hover:border-[var(--dark-text-muted)] hover:text-[var(--dark-text)]"
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{hasDateFilter ? `${filters.date_from || "..."} to ${filters.date_to || "..."}` : "Date Range"}</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${dateOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dateOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
              <div className="absolute top-full mt-2 left-0 z-50 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl shadow-xl shadow-black/40 p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--dark-text-muted)]">From</label>
                  <input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(e) => onFilterChange("date_from", e.target.value || undefined)}
                    className="px-3 py-2 rounded-lg text-sm bg-[var(--dark-card)] border border-[var(--dark-border)] text-[var(--dark-text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--dark-text-muted)]">To</label>
                  <input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(e) => onFilterChange("date_to", e.target.value || undefined)}
                    className="px-3 py-2 rounded-lg text-sm bg-[var(--dark-card)] border border-[var(--dark-border)] text-[var(--dark-text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                  />
                </div>
                {hasDateFilter && (
                  <button
                    onClick={() => {
                      onFilterChange("date_from", undefined);
                      onFilterChange("date_to", undefined);
                      setDateOpen(false);
                    }}
                    className="text-xs text-[var(--accent-red)] hover:text-red-400 transition-colors font-medium cursor-pointer text-left"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
