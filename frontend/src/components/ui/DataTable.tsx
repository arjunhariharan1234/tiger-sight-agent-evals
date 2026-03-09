"use client";

interface Column {
  key: string;
  title: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
}

export default function DataTable({ columns, data, onRowClick }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--dark-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider px-4 py-3"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={String(row.id ?? idx)}
              className={`border-b border-[var(--dark-border-subtle)] transition-colors duration-150 hover:bg-[var(--dark-card-hover)] ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="text-sm text-[var(--dark-text-secondary)] px-4 py-3">
                  {String(row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center text-sm text-[var(--dark-text-muted)] py-8">No data available</div>
      )}
    </div>
  );
}
