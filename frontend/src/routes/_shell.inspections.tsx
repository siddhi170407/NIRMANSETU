import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CheckCircle2, XCircle, Eye, CalendarClock } from "lucide-react";
import { Btn, Card, PageHeader, StatCard, StatusBadge, Table, Tabs, pageMeta } from "@/components/app/ui";
import { fmtDate, inspections } from "@/lib/data";

export const Route = createFileRoute("/_shell/inspections")({
  head: () => pageMeta("Inspections", "Schedule, log and review quality, safety and structural inspections."),
  component: Inspections,
});

function Inspections() {
  const [f, setF] = useState("All");
  const list = inspections.filter((i) => f === "All" || i.result === f);
  const c = (r: string) => inspections.filter((i) => i.result === r).length;
  return (
    <div>
      <PageHeader eyebrow="Quality & safety" title="Inspection management" description="Third-party and departmental inspections with scores and outcomes." actions={<Btn><Plus className="h-4 w-4" /> Schedule inspection</Btn>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Passed" value={String(c("Passed"))} icon={CheckCircle2} />
        <StatCard label="With observations" value={String(c("Observations"))} icon={Eye} />
        <StatCard label="Failed" value={String(c("Failed"))} icon={XCircle} />
        <StatCard label="Scheduled" value={String(c("Scheduled"))} icon={CalendarClock} />
      </div>
      <div className="mb-4"><Tabs items={["All", "Passed", "Observations", "Failed", "Scheduled"]} value={f} onChange={setF} /></div>
      <Card>
        <Table head={["ID", "Inspection", "Project", "Inspector", "Date", "Score", "Result"]}>
          {list.map((i) => (
            <tr key={i.id}>
              <td className="font-mono text-xs text-muted-foreground">{i.id}</td>
              <td className="font-medium">{i.type}</td>
              <td className="text-muted-foreground">{i.project}</td>
              <td>{i.inspector}</td>
              <td className="whitespace-nowrap text-muted-foreground">{fmtDate(i.date)}</td>
              <td className="font-semibold">{i.score ?? "—"}</td>
              <td><StatusBadge status={i.result} /></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
