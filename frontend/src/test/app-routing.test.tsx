import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each([
    ["/", "/_shell/"],
    ["/login", "/login"],
    ["/projects", "/_shell/projects/"],
    ["/projects/NS-RD-0142", "/_shell/projects/$id"],
    ["/milestones", "/_shell/milestones"],
    ["/inspections", "/_shell/inspections"],
    ["/payments", "/_shell/payments"],
    ["/documents", "/_shell/documents"],
    ["/analytics", "/_shell/analytics"],
    ["/audit", "/_shell/audit"],
  ])("matches the imported page for %s", (path, routeId) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes(path);

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe(routeId);
  });
});
