import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, PageHeader, StatusBadge, pageMeta } from "@/components/app/ui";
import { fmtDate, getProject, milestones } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/milestones")({
  head: () => pageMeta("Milestones", "Milestone tracking and Gantt-style timelines across infrastructure projects."),
  component: Milestones,
});

const start = new Date("2024-01-01").getTime();
const end = new Date("2027-01-01").getTime();
const pos = (d: string) => ((new Date(d).getTime() - start) / (end - start)) * 100;
const years = ["2024", "2025", "2026"];

function Milestones() {
  const groups = Array.from(new Set(milestones.map((m) => m.project)));
  return (
    <div>
      <PageHeader eyebrow="Schedule" title="Milestone tracking" description="Contractual milestones plotted against the programme timeline. Diamonds mark due dates." />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {(["Completed", "On Track", "At Risk", "Delayed"] as const).map((s) => (
          <Card key={s} className="flex items-center justify-between p-4"><StatusBadge status={s} /><span className="font-display text-xl font-semibold">{milestones.filter((m) => m.status === s).length}</span></Card>
        ))}
      </div>
      {groups.map((g) => (
        <Card key={g} className="mb-6">
          <CardHeader title={getProject(g)?.name ?? g} subtitle={g} />
          <div className="overflow-x-auto p-5">
            <div className="min-w-[720px]">
              <div className="ml-[38%] grid grid-cols-3 border-b pb-2 text-xs font-semibold text-muted-foreground">{years.map((y) => <span key={y}>{y}</span>)}</div>
              {milestones.filter((m) => m.project === g).map((m) => {
                const c = m.status === "Completed" ? "bg-success" : m.status === "At Risk" ? "bg-warning" : m.status === "Delayed" ? "bg-destructive" : m.status === "On Track" ? "bg-primary" : "bg-muted-foreground/40";
                const left = Math.max(0, pos(m.due) - 18);
                return (
                  <div key={m.id} className="flex items-center border-b py-3 last:border-0">
                    <div className="w-[38%] pr-4"><p className="truncate text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">Due {fmtDate(m.due)}</p></div>
                    <div className="relative h-6 flex-1 rounded bg-muted/50">
                      <div className={cn("absolute top-1.5 h-3 rounded-full opacity-80", c)} style={{ left: `${left}%`, width: `${pos(m.due) - left}%` }} />
                      <div className={cn("absolute top-1 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm ring-2 ring-card", c)} style={{ left: `${pos(m.due)}%` }} />
                    </div>
                    <div className="w-32 pl-4 text-right"><StatusBadge status={m.status} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
