"use client";

import { useState, useRef } from "react";
import SectionCard from "@/components/ui/SectionCard";
import DataTable from "@/components/ui/DataTable";
import { uploadLearnings, validateUpload } from "@/lib/api";

export default function LearningUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<Record<string, unknown> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    try {
      const v = await validateUpload(selectedFile);
      setValidation(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadLearnings(file);
      setResult(res);
      setFile(null);
      setValidation(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const previewColumns = validation?.columns
    ? (validation.columns as string[]).map((c: string) => ({ key: c, title: c }))
    : [];

  const previewData = validation?.preview
    ? (validation.preview as Record<string, unknown>[]).map((row, idx) => ({
        id: String(idx),
        ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "")])),
      }))
    : [];

  return (
    <SectionCard title="Upload Knowledgebase" accent="amber" description="Upload manager observations and domain expertise as CSV/XLSX files to supplement AI-generated learnings.">
      <div className="p-5">
        {result && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--accent-green-dim)] border border-[var(--accent-green)]/30 text-sm text-[var(--accent-green)]">
            Added {String(result.records_added)} learnings. Total: {String(result.total_learnings)}.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--accent-red-dim)] border border-[var(--accent-red)]/30 text-sm text-[var(--accent-red)]">
            {error}
          </div>
        )}

        <div
          className="border-2 border-dashed border-[var(--dark-border)] rounded-xl p-8 text-center hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-dim)] transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          <svg className="w-10 h-10 mx-auto mb-3 text-[var(--dark-text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-[var(--dark-text-muted)] group-hover:text-[var(--dark-text-secondary)]">
            {file ? file.name : "Drop CSV or XLSX file here, or click to browse"}
          </p>
        </div>

        {validation && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${validation.valid ? "bg-[var(--accent-green-dim)] text-[var(--accent-green)] border-[var(--accent-green)]/30" : "bg-[var(--accent-red-dim)] text-[var(--accent-red)] border-[var(--accent-red)]/30"}`}>
                {validation.valid ? "Valid" : "Invalid"}
              </span>
              <span className="text-sm text-[var(--dark-text-muted)]">{String(validation.row_count)} rows</span>
            </div>

            {previewData.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--dark-text-muted)] mb-2">Preview</h4>
                <DataTable columns={previewColumns} data={previewData} />
              </div>
            )}

            {Boolean(validation.valid) && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white text-sm font-semibold hover:shadow-[var(--glow-cyan)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                {uploading ? "Uploading..." : "Activate Learnings"}
              </button>
            )}
          </div>
        )}

        <div className="mt-5 p-3 rounded-lg bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--dark-text-muted)] mb-1">Expected Format</h4>
          <p className="text-xs text-[var(--dark-text-muted)]">
            CSV or XLSX: agent_type, incident_type, scenario, manager_learning, instruction, recommended_action, priority, notes, updated_by, updated_at
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
