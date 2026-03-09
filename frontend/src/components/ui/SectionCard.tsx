"use client";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  accent?: "cyan" | "purple" | "green" | "amber" | "red";
  icon?: React.ReactNode;
}

export default function SectionCard({ title, description, children, accent = "cyan", icon }: SectionCardProps) {
  const accentColors = {
    cyan: "border-t-[var(--accent-cyan)]",
    purple: "border-t-[var(--accent-purple)]",
    green: "border-t-[var(--accent-green)]",
    amber: "border-t-[var(--accent-primary)]",
    red: "border-t-[var(--accent-red)]",
  };

  return (
    <div className={`bg-[var(--dark-card)] border border-[var(--dark-border)] rounded-2xl border-t-2 ${accentColors[accent]} glow-border overflow-hidden`}>
      {title && (
        <div className="flex items-start gap-2 px-5 py-3 border-b border-[var(--dark-border-subtle)]">
          {icon && <span className="text-[var(--accent-primary)] mt-0.5">{icon}</span>}
          <div>
            <h3 className="text-sm font-semibold text-[var(--dark-text)] tracking-wide uppercase">{title}</h3>
            {description && (
              <p className="text-[11px] text-[var(--dark-text-muted)] mt-0.5 font-normal normal-case tracking-normal">{description}</p>
            )}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
