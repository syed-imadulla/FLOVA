import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLatestCheckin } from "../data/useLatestCheckin";
import { formatINR, toPaise } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { AppShell } from "../components/layout/AppShell";

export function CheckinPage() {
  const { checkin, loading, error: loadError, add } = useLatestCheckin();

  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [cod, setCod] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    // Validate cash and bank
    const cashRes = parseOptionalRupees(cash || "0");
    if (!cashRes.ok || cashRes.paise === null || cashRes.paise < 0) {
      setError(cashRes.ok ? "Cash amount must be 0 or more" : `Cash: ${cashRes.message}`);
      return;
    }

    const bankRes = parseOptionalRupees(bank || "0");
    if (!bankRes.ok || bankRes.paise === null || bankRes.paise < 0) {
      setError(bankRes.ok ? "Bank amount must be 0 or more" : `Bank: ${bankRes.message}`);
      return;
    }

    const codRes = parseOptionalRupees(cod || "0");
    if (!codRes.ok || codRes.paise === null || codRes.paise < 0) {
      setError(codRes.ok ? "COD amount must be 0 or more" : `COD: ${codRes.message}`);
      return;
    }

    const totalCashBank = cashRes.paise + bankRes.paise;
    if (codRes.paise > totalCashBank) {
      setError("COD amount cannot exceed total cash and bank");
      return;
    }

    setSaving(true);
    try {
      await add({
        cash: cashRes.paise,
        bank: bankRes.paise,
        notMine: codRes.paise,
      });
      setSavedMessage("Balance check-in recorded successfully!");
      setCash("");
      setBank("");
      setCod("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record check-in");
    } finally {
      setSaving(false);
    }
  }

  const latestCash = checkin ? toPaise(checkin.cash_amount) : 0;
  const latestBank = checkin ? toPaise(checkin.bank_amount) : 0;
  const latestNotMine = checkin ? toPaise(checkin.not_mine_amount) : 0;
  const latestAvailable = latestCash + latestBank - latestNotMine;

  return (
    <AppShell activeNav="home">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Verified Calibration
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Balance Check-In
            </h1>
          </div>

          <Link
            to="/app"
            className="text-xs font-bold text-[#0F5C4C] hover:underline"
          >
            ← View Runway
          </Link>
        </div>

        {(error || loadError) && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium leading-relaxed">
            {error || loadError}
          </div>
        )}

        {savedMessage && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
            {savedMessage}
          </div>
        )}

        {/* Latest Checked In Balance Banner */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
          <span className="text-xs font-mono font-bold uppercase text-[#7A7468] block mb-1">
            Latest Recorded Check-In
          </span>
          {loading ? (
            <div className="text-xs text-[#7A7468] animate-pulse">Loading latest snapshot...</div>
          ) : checkin ? (
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#0F5C4C] font-mono tabular-nums">
                {formatINR(latestAvailable)}{" "}
                <span className="text-xs font-normal text-[#7A7468]">Available</span>
              </div>
              <div className="text-xs text-[#7A7468] mt-2 space-y-1">
                <div>Cash: {formatINR(latestCash)} • Bank: {formatINR(latestBank)}</div>
                <div className="text-[#B45309] font-medium">
                  Custodial COD: {formatINR(latestNotMine)} (Ringfenced)
                </div>
                <div className="text-[11px] text-[#9A9488]">
                  Checked: {new Date(checkin.checked_at).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#B45309] font-medium">
              No balance check-in on record yet. Complete your first check-in below to anchor your runway.
            </div>
          )}
        </div>

        {/* Check-In Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E2DC] shadow-sm">
          <h2 className="text-lg font-bold text-[#16181D] mb-4">Count Your Money Now</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="chk-cash" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Physical Cash in Pocket / Bag (₹)
              </label>
              <input
                id="chk-cash"
                type="number"
                step="any"
                placeholder="e.g. 1200"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-base font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
              />
            </div>

            <div>
              <label htmlFor="chk-bank" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Bank / UPI Balance (₹)
              </label>
              <input
                id="chk-bank"
                type="number"
                step="any"
                placeholder="e.g. 3500"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-base font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF8EB] border border-[#FDE68A]">
              <label htmlFor="chk-cod" className="block text-xs font-bold uppercase tracking-wider text-[#92400E] mb-1.5">
                Of Above Total, How Much is COD (Company Cash)? ₹
              </label>
              <input
                id="chk-cod"
                type="number"
                step="any"
                placeholder="e.g. 800"
                value={cod}
                onChange={(e) => setCod(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-white text-base font-mono tabular-nums text-[#92400E] focus:outline-none focus:border-amber-600"
              />
              <span className="text-[11px] text-[#B45309] block mt-1.5">
                Customer cash collected on deliveries. This is ringfenced and not counted as available cash.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-sm font-bold tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving Check-In..." : "Save Balance Check-In"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
