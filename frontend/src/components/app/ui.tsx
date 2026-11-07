import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card shadow-card", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({ children, variant = "primary", className, onClick, type = "button" }: { children: ReactNode; variant?: "primary" | "outline" | "accent"; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border bg-card text-foreground hover:bg-muted",
    accent: "bg-accent-gradient text-accent-foreground hover:opacity-90",
  }[variant];
  return (
    <button type={type} onClick={onClick} className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", v, className)}>
      {children}
    </button>
  );
}

const tone: Record<string, string> = {
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/15 text-accent-foreground ring-warning/35",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  info: "bg-info/10 text-info ring-info/25",
  neutral: "bg-muted text-muted-foreground ring-border",
};

const statusTone: Record<string, keyof typeof tone> = {
  "On Track": "success", Completed: "success", Passed: "success", Released: "success",
  "At Risk": "warning", Observations: "warning", "Under Verification": "warning", "Pending Approval": "info",
  Delayed: "danger", Failed: "danger", "On Hold": "danger",
  Planning: "neutral", Scheduled: "info",
};

export function StatusBadge({ status }: { status: string }) {
  const t = tone[statusTone[status] ?? "neutral"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", t)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 90 ? "bg-success" : value >= 40 ? "bg-primary" : "bg-accent";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function StatCard({ label, value, delta, icon: Icon, trend = "up" }: { label: string; value: string; delta?: string; icon: LucideIcon; trend?: "up" | "down" }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {delta && <p className={cn("mt-1 text-xs font-medium", trend === "up" ? "text-success" : "text-destructive")}>{delta}</p>}
    </Card>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y [&_td]:px-5 [&_td]:py-3.5 [&_tr]:transition-colors [&_tr:hover]:bg-muted/40">{children}</tbody>
      </table>
    </div>
  );
}

export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border bg-card p-1">
      {items.map((i) => (
        <button key={i} onClick={() => onChange(i)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", value === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          {i}
        </button>
      ))}
    </div>
  );
}

export const pageMeta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · NirmanSetu` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · NirmanSetu` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
