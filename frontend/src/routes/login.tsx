import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Landmark, ShieldCheck, ArrowRight } from "lucide-react";
import { Btn, pageMeta } from "@/components/app/ui";
import { roles, setRole, type Role } from "@/lib/role";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => pageMeta("Sign in", "Secure sign-in to NirmanSetu for administrators, project managers, contractors, inspectors and auditors."),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [role, setR] = useState<Role>("Administrator");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero p-12 lg:flex lg:flex-col">
        <div className="grid-pattern absolute inset-0" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-accent-foreground"><Landmark className="h-5 w-5" /></span>
          <span className="font-display text-lg font-semibold text-primary-foreground">NirmanSetu</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl font-semibold leading-tight text-primary-foreground">Every rupee, every milestone, <span className="text-accent">accountable.</span></h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">Unified monitoring for roads, bridges, water networks and public buildings — from contract award to final handover.</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
            {[["1,284", "Projects"], ["₹48k Cr", "Monitored"], ["36", "Districts"]].map(([v, l]) => (
              <div key={l}><p className="font-display text-xl font-semibold text-primary-foreground">{v}</p><p className="text-xs text-primary-foreground/60">{l}</p></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form className="w-full max-w-sm" onSubmit={(e) => { e.preventDefault(); setRole(role); nav({ to: "/" }); }}>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your departmental credentials.</p>
          <label className="mt-8 block text-xs font-semibold">Official email</label>
          <input type="email" defaultValue="s.iyer@pwd.gov.in" className="mt-1.5 h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <label className="mt-4 block text-xs font-semibold">Password</label>
          <input type="password" defaultValue="password" className="mt-1.5 h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <p className="mt-5 text-xs font-semibold">Sign in as</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((r) => (
              <button type="button" key={r} onClick={() => setR(r)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors", role === r ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>{r}</button>
            ))}
          </div>
          <Btn type="submit" variant="primary" className="mt-8 h-10 w-full">Continue <ArrowRight className="h-4 w-4" /></Btn>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Protected under GIGW & CERT-In guidelines</p>
        </form>
      </div>
    </div>
  );
}
