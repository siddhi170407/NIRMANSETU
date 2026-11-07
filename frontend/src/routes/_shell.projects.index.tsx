import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MapPin, Route as RouteIcon, Waves, Building2, Droplets, Construction } from "lucide-react";
import { Btn, Card, PageHeader, ProgressBar, StatusBadge, Tabs, pageMeta } from "@/components/app/ui";
import { projects, inr } from "@/lib/data";

export const Route = createFileRoute("/_shell/projects/")({
  head: () => pageMeta("Projects", "Portfolio of roads, bridges, water supply networks and public buildings with progress indicators."),
  component: Projects,
});

const icons = { Road: RouteIcon, Bridge: Construction, "Water Supply": Droplets, "Public Building": Building2, Drainage: Waves };
const filters = ["All", "Road", "Bridge", "Water Supply", "Public Building", "Drainage"];

function Projects() {
  const [f, setF] = useState("All");
  const list = projects.filter((p) => f === "All" || p.type === f);
  return (
    <div>
      <PageHeader eyebrow="Portfolio" title="Projects" description="Track physical and financial progress across all sanctioned works." actions={<Btn><Plus className="h-4 w-4" /> New project</Btn>} />
      <div className="mb-5"><Tabs items={filters} value={f} onChange={setF} /></div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const Icon = icons[p.type];
          return (
            <Link key={p.id} to="/projects/$id" params={{ id: p.id }}>
              <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">{p.id} · {p.type}</p>
                <h3 className="mt-1 line-clamp-2 text-base font-semibold group-hover:text-primary">{p.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {p.location}, {p.district}</p>
                <div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted-foreground">Physical progress</span><span className="font-semibold">{p.progress}%</span></div>
                <ProgressBar value={p.progress} className="mt-2" />
                <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
                  <div><p className="text-muted-foreground">Budget</p><p className="mt-0.5 font-semibold">{inr(p.budget)}</p></div>
                  <div><p className="text-muted-foreground">Contractor</p><p className="mt-0.5 truncate font-semibold">{p.contractor}</p></div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
