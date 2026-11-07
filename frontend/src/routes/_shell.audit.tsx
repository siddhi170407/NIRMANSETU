import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Card, PageHeader, pageMeta } from "@/components/app/ui";
import { auditLog } from "@/lib/data";

export const Route = createFileRoute("/_shell/audit")({
  head: () => pageMeta("Audit Trail", "Tamper-evident history of every action taken on NirmanSetu."),
  component: Audit,
});

function Audit() {
  return (
    <div>
      <PageHeader eyebrow="Governance" title="Audit activity history" description="Immutable, time-stamped log of user actions for accountability and RTI compliance." />
      <Card className="mb-6 flex items-center gap-3 p-4 text-sm">
        <ShieldCheck className="h-5 w-5 text-success" />
        <span>Log integrity verified · last hash check <span className="font-semibold">30 Oct 2026, 15:00 IST</span></span>
      </Card>
      <Card className="p-5 md:p-6">
        <ol className="relative space-y-6 border-l pl-6">
          {auditLog.map((a) => (
            <li key={a.time + a.user} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-accent ring-4 ring-card" />
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <p className="text-sm"><span className="font-semibold">{a.user}</span> <span className="text-muted-foreground">· {a.role}</span></p>
                <p className="font-mono text-xs text-muted-foreground">{a.time} IST · {a.ip}</p>
              </div>
              <p className="mt-1 text-sm"><span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">{a.action}</span> <span className="ml-1">{a.target}</span></p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
