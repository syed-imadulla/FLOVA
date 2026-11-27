/** Deterministic parent-route resolution and history-aware back navigation helpers. */

export interface BackNavigationInput {
  back?: boolean | string;
  historyIdx?: number | null;
  originRoute?: string | null;
  pathname: string;
}

export type BackNavigationTarget =
  | { type: "history" }
  | { type: "route"; to: string; replace: boolean };

const DEFAULT_PARENT_ROUTES: Array<[prefix: string, parent: string]> = [
  ["/groups/", "/groups"],
  ["/people/", "/people"],
  ["/wish", "/more"],
  ["/commitments", "/more"],
  ["/groups", "/more"],
  ["/invoices", "/more"],
  ["/payouts", "/more"],
  ["/profile", "/more"],
  ["/insights", "/money"],
  ["/import", "/activity"],
];

/** Returns the canonical parent route for a screen when no in-app history is available. */
export function resolveFallbackParent(pathname: string): string {
  for (const [prefix, parent] of DEFAULT_PARENT_ROUTES) {
    if (pathname.startsWith(prefix)) return parent;
  }
  return "/app";
}

/**
 * Resolves the target for a screen's top-left back action.
 * Prefers popping legitimate in-app history (`historyIdx > 0`), then an explicit
 * `originRoute`, then the screen's declared `back` parent, then `resolveFallbackParent`.
 */
export function resolveBackNavigation(input: BackNavigationInput): BackNavigationTarget {
  if (typeof input.historyIdx === "number" && input.historyIdx > 0) {
    return { type: "history" };
  }
  if (typeof input.originRoute === "string" && input.originRoute.length > 0 && input.originRoute !== input.pathname) {
    return { type: "route", to: input.originRoute, replace: true };
  }
  if (typeof input.back === "string" && input.back.length > 0) {
    return { type: "route", to: input.back, replace: true };
  }
  return { type: "route", to: resolveFallbackParent(input.pathname), replace: true };
}
