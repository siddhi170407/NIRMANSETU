import { useEffect, useState } from "react";

export const roles = ["Administrator", "Project Manager", "Contractor", "Inspector", "Auditor"] as const;
export type Role = (typeof roles)[number];

const KEY = "ns-role";
const listeners = new Set<(r: Role) => void>();

export function setRole(r: Role) {
  localStorage.setItem(KEY, r);
  listeners.forEach((l) => l(r));
}

export function useRole(): Role {
  const [role, set] = useState<Role>("Administrator");
  useEffect(() => {
    const s = localStorage.getItem(KEY) as Role | null;
    if (s && roles.includes(s)) set(s);
    listeners.add(set);
    return () => void listeners.delete(set);
  }, []);
  return role;
}
