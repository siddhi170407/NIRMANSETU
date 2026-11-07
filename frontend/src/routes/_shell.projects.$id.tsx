import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Download, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Btn, Card, CardHeader, PageHeader, ProgressBar, StatusBadge, pageMeta } from "@/components/app/ui";
import { documents, fmtDate, getProject, inr, inspections, milestones, payments } from "@/lib/data";

export const Route = createFileRoute("/_shell/projects/$id")({
  loader: ({ params }) => {
    const p = getProject(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => pageMeta(loaderData?.name ?? "Project", loaderData?.description ?? "Project details and contract information."),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Project not found. <Link to="/projects" className="text-accent">Back to projects</Link></p>,
  component: Detail,
});

function Detail() {
  const p = Route.useLoaderData();
  const ms = milestones.filter((m) => m.project === p.id);
  const util = Math.round((p.spent / p.budget) * 100);
  return (
    <div>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> All projects</Link>
      <PageHeader eyebrow={`${p.id} · ${p.type}`} title={p.name} description={p.description} actions={<><Btn variant="outline"><Download className="h-4 w-4" /> Export</Btn><Btn>Edit project</Btn></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-xs text-muted-foreground">Status</p><div className="mt-2"><StatusBadge status={p.status} /></div></Card>
        <Card className="p-5"><p className="text-xs text-muted-foreground">Physical progress</p><p className="mt-1 font-display text-2xl font-semibold">{p.progress}%</p><ProgressBar value={p.progress} className="mt-2" /></Card>
        <Card className="p-5"><p className="text-xs text-muted-foreground">Financial progress</p><p className="mt-1 font-display text-2xl font-semibold">{util}%</p><ProgressBar value={util} className="mt-2" /></Card>
        <Card className="p-5"><p className="text-xs text-muted-foreground">Spent / Sanctioned</p><p className="mt-1 font-display text-2xl font-semibold">{inr(p.spent)}</p><p className="text-xs text-muted-foreground">of {inr(p.budget)}</p></Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Milestone timeline" subtitle="Weighted contribution to overall progress" />
          <div className="p-5">
            {ms.length === 0 && <p className="text-sm text-muted-foreground">No milestones defined yet.</p>}
            <ol className="relative space-y-6 border-l border-border pl-6">
              {ms.map((m) => {
                const Icon = m.status === "Completed" ? CheckCircle2 : m.status === "At Risk" || m.status === "Delayed" ? AlertCircle : Circle;
                const c = m.status === "Completed" ? "text-success" : m.status === "At Risk" ? "text-warning" : m.status === "Delayed" ? "text-destructive" : "text-muted-foreground";
                return (
                  <li key={m.id} className="relative">
                    <Icon className={`absolute -left-[33px] top-0.5 h-4 w-4 bg-card ${c}`} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{m.title}</p><StatusBadge status={m.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Due {fmtDate(m.due)}{m.done && ` · Achieved ${fmtDate(m.done)}`} · Weight {m.weight}%</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
        <Card>
          <CardHeader title="Contract information" />
          <dl className="divide-y text-sm">
            {[["Contract no.", p.contractNo], ["Contractor", p.contractor], ["Project manager", p.manager], ["Location", `${p.location}, ${p.district}`], ["Start date", fmtDate(p.start)], ["Scheduled completion", fmtDate(p.end)], ["Defect liability", "5 years"], ["Performance guarantee", inr(Math.round(p.budget * 0.05))]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <MiniList title="Inspections" rows={inspections.filter((i) => i.project === p.id).map((i) => [i.type, fmtDate(i.date), i.result])} />
        <MiniList title="Payments" rows={payments.filter((i) => i.project === p.id).map((i) => [i.bill, inr(i.amount), i.status])} />
        <MiniList title="Documents" rows={documents.filter((i) => i.project === p.id).map((i) => [i.name, i.size, ""])} />
      </div>
    </div>
  );
}

function MiniList({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="divide-y">
        {rows.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">Nothing recorded yet.</li>}
        {rows.map(([a, b, s]) => (
          <li key={a} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{a}</p><p className="text-xs text-muted-foreground">{b}</p></div>
            {s && <StatusBadge status={s} />}
          </li>
        ))}
      </ul>
    </Card>
  );
}
