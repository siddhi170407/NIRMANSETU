import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Wallet, Clock, PiggyBank } from "lucide-react";
import { Card, CardHeader, PageHeader, ProgressBar, StatCard, StatusBadge, Table, pageMeta } from "@/components/app/ui";
import { fmtDate, inr, payments, projects } from "@/lib/data";

export const Route = createFileRoute("/_shell/payments")({
  head: () => pageMeta("Payments & Budget", "Running account bills, releases and budget utilisation for every project."),
  component: Payments,
});

function Payments() {
  const total = projects.reduce((a, p) => a + p.budget, 0);
  const spent = projects.reduce((a, p) => a + p.spent, 0);
  const pending = payments.filter((p) => p.status !== "Released").reduce((a, p) => a + p.amount, 0);
  const chart = projects.map((p) => ({ name: p.id.slice(3), budget: p.budget, spent: p.spent }));
  return (
    <div>
      <PageHeader eyebrow="Finance" title="Payment & budget monitoring" description="Sanctioned outlay, expenditure and bill pipeline across the portfolio." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sanctioned" value={inr(total)} icon={IndianRupee} />
        <StatCard label="Expended" value={inr(spent)} delta={`${Math.round((spent / total) * 100)}% utilisation`} icon={Wallet} />
        <StatCard label="Bills in pipeline" value={inr(Math.round(pending * 10) / 10)} icon={Clock} />
        <StatCard label="Balance available" value={inr(total - spent)} icon={PiggyBank} />
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Budget vs expenditure by project" subtitle="₹ crore" />
          <div className="h-80 p-4">
            <ResponsiveContainer>
              <BarChart data={chart} barGap={4}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="budget" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spent" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Utilisation" />
          <ul className="space-y-4 p-5">
            {projects.map((p) => {
              const u = Math.round((p.spent / p.budget) * 100);
              return (
                <li key={p.id}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="truncate pr-2 font-medium">{p.name}</span><span className="font-semibold">{u}%</span></div>
                  <ProgressBar value={u} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Bills & releases" />
        <Table head={["Reference", "Bill", "Project", "Amount", "Date", "Status"]}>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="font-mono text-xs text-muted-foreground">{p.id}</td>
              <td className="font-medium">{p.bill}</td>
              <td className="text-muted-foreground">{p.project}</td>
              <td className="font-semibold">{inr(p.amount)}</td>
              <td className="whitespace-nowrap text-muted-foreground">{fmtDate(p.date)}</td>
              <td><StatusBadge status={p.status} /></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
