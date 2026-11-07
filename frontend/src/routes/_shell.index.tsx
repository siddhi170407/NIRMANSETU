import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FolderKanban, IndianRupee, AlertTriangle, ClipboardCheck, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, PageHeader, ProgressBar, StatCard, StatusBadge, Btn, pageMeta } from "@/components/app/ui";
import { auditLog, inspections, inr, monthlySpend, projects, fmtDate } from "@/lib/data";
import { useRole, type Role } from "@/lib/role";

export const Route = createFileRoute("/_shell/")({
  head: () => pageMeta("Dashboard", "Role-based overview of public infrastructure projects, budgets, inspections and alerts."),
  component: Dashboard,
});

const focus: Record<Role, { title: string; desc: string; cta: string; to: "/projects" | "/payments" | "/inspections" | "/audit" | "/analytics" }> = {
  Administrator: { title: "State portfolio at a glance", desc: "Monitor all departments, users and approvals across 8 active packages.", cta: "View analytics", to: "/analytics" },
  "Project Manager": { title: "Your projects need attention", desc: "2 milestones at risk and 1 bill awaiting your recommendation.", cta: "Review projects", to: "/projects" },
  Contractor: { title: "Submit bills & track releases", desc: "RA Bill #14 is pending approval. 1 inspection scheduled next week.", cta: "Open payments", to: "/payments" },
  Inspector: { title: "2 inspections scheduled", desc: "Upcoming: M40 cube strength at Bhubaneswar on 04 Nov.", cta: "Go to inspections", to: "/inspections" },
  Auditor: { title: "3 items flagged for review", desc: "Payment variance detected on RA-033-22 exceeding BOQ tolerance.", cta: "Open audit trail", to: "/audit" },
};

function Dashboard() {
  const role = useRole();
  const f = focus[role];
  const total = projects.reduce((a, p) => a + p.budget, 0);
  const spent = projects.reduce((a, p) => a + p.spent, 0);
  return (
    <div>
      <PageHeader eyebrow={`${role} workspace`} title="Good evening, S. Iyer" description="Here's what's happening across your infrastructure portfolio today." />
      <Card className="relative mb-6 overflow-hidden border-0 bg-hero p-6 md:p-8">
        <div className="grid-pattern absolute inset-0" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-foreground">{f.title}</h2>
            <p className="mt-1 text-sm text-primary-foreground/70">{f.desc}</p>
          </div>
          <Link to={f.to}><Btn variant="accent">{f.cta} <ArrowUpRight className="h-4 w-4" /></Btn></Link>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={String(projects.filter((p) => p.status !== "Completed").length)} delta="+2 this quarter" icon={FolderKanban} />
        <StatCard label="Sanctioned budget" value={inr(total)} delta={`${Math.round((spent / total) * 100)}% utilised`} icon={IndianRupee} />
        <StatCard label="Delayed / at risk" value={String(projects.filter((p) => p.status === "Delayed" || p.status === "At Risk").length)} delta="+1 since last week" trend="down" icon={AlertTriangle} />
        <StatCard label="Inspection pass rate" value="86%" delta="+4.2% vs last month" icon={ClipboardCheck} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Expenditure — planned vs actual" subtitle="₹ crore, last 6 months" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <AreaChart data={monthlySpend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area dataKey="planned" stroke="var(--chart-1)" fill="transparent" strokeDasharray="4 4" strokeWidth={2} />
                <Area dataKey="actual" stroke="var(--chart-2)" fill="url(#g1)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent activity" action={<Link to="/audit" className="text-xs font-semibold text-accent">View all</Link>} />
          <ul className="divide-y">
            {auditLog.slice(0, 5).map((a) => (
              <li key={a.time} className="px-5 py-3">
                <p className="text-sm"><span className="font-semibold">{a.user}</span> <span className="text-muted-foreground">{a.action.toLowerCase()}</span></p>
                <p className="truncate text-xs text-muted-foreground">{a.target}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Priority projects" action={<Link to="/projects" className="text-xs font-semibold text-accent">All projects</Link>} />
          <ul className="divide-y">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link to="/projects/$id" params={{ id: p.id }} className="flex flex-col gap-2 px-5 py-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id} · {p.district}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-48"><ProgressBar value={p.progress} /><span className="w-9 text-right text-xs font-semibold">{p.progress}%</span></div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Upcoming inspections" />
          <ul className="divide-y">
            {inspections.filter((i) => i.result === "Scheduled").map((i) => (
              <li key={i.id} className="flex gap-3 px-5 py-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-center leading-none">
                  <span className="text-sm font-bold">{new Date(i.date).getDate()}</span>
                </div>
                <div><p className="text-sm font-semibold">{i.type}</p><p className="text-xs text-muted-foreground">{i.project} · {fmtDate(i.date)}</p></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
