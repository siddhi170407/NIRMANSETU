import { createFileRoute } from "@tanstack/react-router";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { FileDown } from "lucide-react";
import { Btn, Card, CardHeader, PageHeader, pageMeta } from "@/components/app/ui";
import { projects } from "@/lib/data";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => pageMeta("Analytics & Reports", "Portfolio analytics: sector mix, schedule performance and downloadable reports."),
  component: Analytics,
});

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const spi = [
  { q: "Q1 25", spi: 0.94, cpi: 0.98 }, { q: "Q2 25", spi: 0.91, cpi: 0.97 }, { q: "Q3 25", spi: 0.95, cpi: 1.01 },
  { q: "Q4 25", spi: 0.97, cpi: 0.99 }, { q: "Q1 26", spi: 0.93, cpi: 0.96 }, { q: "Q2 26", spi: 0.96, cpi: 1.0 },
];
const reports = ["Monthly Progress Report — Oct 2026", "Quarterly Expenditure Statement — Q2 FY27", "Delayed Projects Exception Report", "Contractor Performance Scorecard"];

function Analytics() {
  const byType = Object.entries(projects.reduce<Record<string, number>>((a, p) => ({ ...a, [p.type]: (a[p.type] ?? 0) + p.budget }), {})).map(([name, value]) => ({ name, value }));
  return (
    <div>
      <PageHeader eyebrow="Insights" title="Analytics & reporting" description="Earned-value indicators and sector distribution for evidence-based decisions." actions={<Btn variant="outline"><FileDown className="h-4 w-4" /> Export PDF</Btn>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Outlay by sector" subtitle="Share of sanctioned budget" />
          <div className="h-80 p-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3} stroke="none">
                  {byType.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Schedule & cost performance index" subtitle="1.0 = on plan" />
          <div className="h-80 p-4">
            <ResponsiveContainer>
              <LineChart data={spi}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="q" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis domain={[0.85, 1.05]} fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="spi" name="SPI" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line dataKey="cpi" name="CPI" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Standard reports" subtitle="Generated nightly" />
        <ul className="grid divide-y md:grid-cols-2 md:divide-y-0">
          {reports.map((r) => (
            <li key={r} className="flex items-center justify-between gap-3 border-b px-5 py-4 md:odd:border-r">
              <span className="text-sm font-medium">{r}</span>
              <Btn variant="outline" className="h-8 px-3 text-xs"><FileDown className="h-3.5 w-3.5" /> Download</Btn>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
