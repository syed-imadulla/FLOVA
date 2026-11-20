// =====================================================================
// FLOVA Financial Activity Page (Owner: M2)
// Connects to authenticated Supabase service: listActivityTimeline().
// Displays unified chronological stream of:
// - Income transactions
// - Living expenses (food, tea, groceries)
// - Work expenses (fuel, bike, phone)
// - Custodial COD collections/remittances (segregated third-party funds)
// - Balance check-ins (baselines with cash & bank breakdown)
// - Scheduled platform payouts (advisory only, zero income balance impact)
// =====================================================================

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { listActivityTimeline } from "../services/data";
import { formatINR, toPaise } from "../lib/money";
import { todayLocalISO } from "../data/dates";
import type { ActivityItem } from "../types/contracts";

export function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "living" | "work" | "checkin" | "expected_payout" | "cod">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listActivityTimeline({ includeExpectedPayouts: true });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity timeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const today = todayLocalISO();

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Date filter
      if (dateFilter === "today" && item.date !== today) return false;
      if (dateFilter === "7days") {
        const d = new Date(item.date);
        const limit = new Date(today);
        limit.setDate(limit.getDate() - 7);
        if (d < limit) return false;
      }
      if (dateFilter === "30days") {
        const d = new Date(item.date);
        const limit = new Date(today);
        limit.setDate(limit.getDate() - 30);
        if (d < limit) return false;
      }

      // Type filter
      if (typeFilter === "income") {
        if (item.type !== "income" || item.ownership === "not_mine") return false;
      } else if (typeFilter === "living") {
        if (item.type !== "expense" || item.expenseType !== "living") return false;
      } else if (typeFilter === "work") {
        if (item.type !== "expense" || item.expenseType !== "work") return false;
      } else if (typeFilter === "checkin") {
        if (item.kind !== "checkin") return false;
      } else if (typeFilter === "expected_payout") {
        if (item.kind !== "expected_payout") return false;
      } else if (typeFilter === "cod") {
        if (item.ownership !== "not_mine") return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        if (!item.category || item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [items, dateFilter, typeFilter, categoryFilter, today]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category && it.category !== "checkin" && it.category !== "payout") {
        set.add(it.category.toLowerCase());
      }
    });
    return Array.from(set);
  }, [items]);

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: "680px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem" }}>
            <Link to="/overview" style={{ color: "#1a365d", textDecoration: "none", fontWeight: 600 }}>← Money Overview</Link>
            {" | "}
            <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Home</Link>
          </p>
          <h1 style={{ fontSize: "1.6rem", margin: 0, color: "#0f172a" }}>Financial Activity</h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link
            to="/add"
            style={{
              padding: "0.5rem 0.85rem",
              background: "#1a365d",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            + Add
          </Link>
          <button
            onClick={loadData}
            title="Refresh activity"
            style={{
              padding: "0.5rem 0.75rem",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div>
            <label htmlFor="filter-time" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
              Time Range
            </label>
            <select
              id="filter-time"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-type" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
              Entry Type
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
            >
              <option value="all">All Types</option>
              <option value="income">Own Income</option>
              <option value="living">Living Expenses</option>
              <option value="work">Work Expenses</option>
              <option value="cod">Custodial COD</option>
              <option value="checkin">Balance Check-in</option>
              <option value="expected_payout">Expected Payout</option>
            </select>
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <label htmlFor="filter-category" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
              Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div role="alert" style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          <p>Loading your verified financial activity...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
          <span style={{ fontSize: "2rem" }}>📋</span>
          <h3 style={{ margin: "0.5rem 0 0.25rem 0", color: "#334155" }}>No matching activity found</h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            {items.length === 0 ? "You haven't recorded any transactions or check-ins yet." : "Try adjusting your filter options above."}
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link to="/add" style={{ padding: "0.5rem 1rem", background: "#1a365d", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "0.9rem" }}>
              Add Transaction
            </Link>
            <Link to="/checkin" style={{ padding: "0.5rem 1rem", background: "#f1f5f9", color: "#334155", textDecoration: "none", borderRadius: "6px", fontSize: "0.9rem" }}>
              Record Check-in
            </Link>
          </div>
        </div>
      ) : (
        /* Activity Stream Cards */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredItems.map((item) => {
            const isCustodial = item.ownership === "not_mine";
            const isCheckin = item.kind === "checkin";
            const isExpectedPayout = item.kind === "expected_payout";
            const isIncome = item.type === "income";

            // Card background and border styling
            let cardBg = "#ffffff";
            let borderColor = "#e2e8f0";
            if (isExpectedPayout) {
              cardBg = "#faf5ff";
              borderColor = "#d8b4fe";
            } else if (isCheckin) {
              cardBg = "#f8fafc";
              borderColor = "#cbd5e1";
            } else if (isCustodial) {
              cardBg = "#fffbeb";
              borderColor = "#fcd34d";
            }

            return (
              <div
                key={item.id}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                {/* Top Row: Title + Amount */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1rem", color: "#0f172a", fontWeight: 600 }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {item.date} {item.source && `· via ${item.source}`}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {isCheckin ? (
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
                        Baseline Saved
                      </span>
                    ) : isExpectedPayout ? (
                      <div>
                        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#7e22ce" }}>
                          +{formatINR(item.amountPaise || toPaise(item.rupeeAmount || 0))}
                        </span>
                        <div style={{ fontSize: "0.7rem", color: "#7e22ce", fontWeight: 600 }}>
                          (Expected)
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: isIncome ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {isIncome ? "+" : "−"} {formatINR(item.amountPaise || toPaise(item.rupeeAmount || 0))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges / Classification Row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginTop: "0.4rem" }}>
                  {isCheckin && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#e2e8f0", color: "#334155", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                      📌 Balance Check-in
                    </span>
                  )}

                  {isExpectedPayout && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#ede9fe", color: "#6b21a8", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                      ⏳ Scheduled Payout
                    </span>
                  )}

                  {item.expenseType === "work" && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#dbeafe", color: "#1e40af", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                      🛵 Work Expense
                    </span>
                  )}

                  {item.expenseType === "living" && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                      🍽 Living Expense
                    </span>
                  )}

                  {isCustodial && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#fef3c7", color: "#92400e", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                      ⚠️ Custodial COD (Not Mine)
                    </span>
                  )}

                  {item.category && item.category !== "checkin" && item.category !== "payout" && (
                    <span style={{ padding: "0.15rem 0.45rem", background: "#f1f5f9", color: "#475569", borderRadius: "4px", fontSize: "0.75rem" }}>
                      🏷 {item.category}
                    </span>
                  )}
                </div>

                {/* Check-in Baseline Breakdown Sub-panel */}
                {isCheckin && item.snapshot && (
                  <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.8rem", color: "#475569" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>Cash: <strong>{formatINR(item.snapshot.cashPaise)}</strong></div>
                      <div>Bank: <strong>{formatINR(item.snapshot.bankPaise)}</strong></div>
                      <div>Net Personal: <strong style={{ color: "#15803d" }}>{formatINR(item.snapshot.totalPersonalPaise)}</strong></div>
                    </div>
                    {item.snapshot.notMinePaise > 0 && (
                      <div style={{ color: "#b45309", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                        Includes {formatINR(item.snapshot.notMinePaise)} segregated COD liability
                      </div>
                    )}
                  </div>
                )}

                {/* Expected Payout Advisory Sub-panel */}
                {isExpectedPayout && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#6b21a8" }}>
                    ℹ️ Scheduled advisory only. Not counted toward current available liquid balance until received.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
