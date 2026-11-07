import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, FolderKanban, Flag, ClipboardCheck, Wallet, FileText, BarChart3, History, Bell, Search, Menu, X, LogOut, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { roles, setRole, useRole, type Role } from "@/lib/role";

export const Route = createFileRoute("/_shell")({ component: Shell });

const nav = [
  { group: "Overview", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/milestones", label: "Milestones", icon: Flag },
  ]},
  { group: "Operations", items: [
    { to: "/inspections", label: "Inspections", icon: ClipboardCheck },
    { to: "/payments", label: "Payments & Budget", icon: Wallet },
    { to: "/documents", label: "Documents", icon: FileText },
  ]},
  { group: "Governance", items: [
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/audit", label: "Audit Trail", icon: History },
  ]},
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient text-sidebar-primary-foreground"><Landmark className="h-5 w-5" /></span>
        <div>
          <p className="font-display text-base font-semibold text-sidebar-accent-foreground">NirmanSetu</p>
          <p className="text-[11px] text-sidebar-muted">Infrastructure Monitoring</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} onClick={onNavigate} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active(i.to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                    <i.icon className={cn("h-4 w-4", active(i.to) && "text-sidebar-primary")} />
                    {i.label}
                    {active(i.to) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <p className="text-xs font-semibold text-sidebar-accent-foreground">FY 2026–27 Outlay</p>
        <p className="mt-1 font-display text-lg font-semibold text-sidebar-primary">₹2,826 Cr</p>
        <p className="text-[11px] text-sidebar-muted">68% utilised across 8 projects</p>
      </div>
      <Link to="/login" className="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:text-sidebar-accent-foreground">
        <LogOut className="h-4 w-4" /> Sign out
      </Link>
    </div>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const role = useRole();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block"><SidebarBody /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-elevated animate-in slide-in-from-left">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-5 text-sidebar-muted"><X className="h-5 w-5" /></button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search projects, bills, inspections…" className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <select aria-label="Switch role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-9 rounded-lg border bg-card px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring">
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button aria-label="Notifications" className="relative rounded-lg border bg-card p-2 hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">SI</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">S. Iyer</p>
                <p className="text-[11px] text-muted-foreground">{role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
