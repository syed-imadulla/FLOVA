import test from "node:test";
import assert from "node:assert/strict";
import { resolveBackNavigation, resolveFallbackParent } from "../../app/navigation";
import { backAction } from "../../native/backAction";

test("More -> WISH / Bills / Groups / Insights -> Back pops history to originating screen", () => {
  for (const pathname of ["/wish", "/commitments", "/groups", "/insights", "/invoices", "/payouts", "/profile"]) {
    const target = resolveBackNavigation({
      back: pathname === "/insights" ? "/money" : "/more",
      historyIdx: 2,
      pathname,
    });
    assert.deepEqual(target, { type: "history" });
  }
});

test("Direct navigation from Home/Money/Insights preserves originating screen via history", () => {
  const moneyToGroups = resolveBackNavigation({ back: "/more", historyIdx: 1, pathname: "/groups" });
  assert.deepEqual(moneyToGroups, { type: "history" });

  const homeToBills = resolveBackNavigation({ back: "/more", historyIdx: 1, pathname: "/commitments" });
  assert.deepEqual(homeToBills, { type: "history" });

  const insightsToBills = resolveBackNavigation({ back: "/more", historyIdx: 3, pathname: "/commitments" });
  assert.deepEqual(insightsToBills, { type: "history" });
});

test("Explicit originRoute is respected when historyIdx is 0", () => {
  const target = resolveBackNavigation({
    back: "/more",
    historyIdx: 0,
    originRoute: "/money",
    pathname: "/groups",
  });
  assert.deepEqual(target, { type: "route", to: "/money", replace: true });
});

test("Deep-linked secondary screens (historyIdx === 0) fall back to canonical parent route", () => {
  assert.deepEqual(resolveBackNavigation({ back: "/more", historyIdx: 0, pathname: "/wish" }), {
    type: "route",
    to: "/more",
    replace: true,
  });
  assert.deepEqual(resolveBackNavigation({ back: "/more", historyIdx: 0, pathname: "/commitments" }), {
    type: "route",
    to: "/more",
    replace: true,
  });
  assert.deepEqual(resolveBackNavigation({ back: "/more", historyIdx: 0, pathname: "/groups" }), {
    type: "route",
    to: "/more",
    replace: true,
  });
  assert.deepEqual(resolveBackNavigation({ back: "/money", historyIdx: 0, pathname: "/insights" }), {
    type: "route",
    to: "/money",
    replace: true,
  });
  assert.deepEqual(resolveBackNavigation({ back: "/groups", historyIdx: 0, pathname: "/groups/abc-123" }), {
    type: "route",
    to: "/groups",
    replace: true,
  });
  assert.deepEqual(resolveBackNavigation({ back: "/people", historyIdx: 0, pathname: "/people/p-1" }), {
    type: "route",
    to: "/people",
    replace: true,
  });
});

test("Android hardware back aligns with canonical parent fallback when canGoBack is false", () => {
  assert.equal(backAction("/wish", true), "history");
  assert.equal(backAction("/wish", false), "home");
  assert.equal(resolveFallbackParent("/wish"), "/more");
  assert.equal(resolveFallbackParent("/commitments"), "/more");
  assert.equal(resolveFallbackParent("/groups"), "/more");
  assert.equal(resolveFallbackParent("/groups/123"), "/groups");
  assert.equal(resolveFallbackParent("/people/456"), "/people");
  assert.equal(resolveFallbackParent("/insights"), "/money");
  assert.equal(resolveFallbackParent("/invoices"), "/more");
  assert.equal(resolveFallbackParent("/checkin"), "/app");
});
