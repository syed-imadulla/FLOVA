// Money — Clear separation of Money to Receive (receivables), Money to Repay (liabilities),
// Available Liquidity vs Sustainable Capital, and confirmation-gated Borrowing/Lending/Repayments.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildDebtPlannerModel } from "../app/debtPlannerModel";
import {
  FINANCIAL_TERMS,
  formatFinancialAmount,
  useFinancialIntelligence,
} from "../app/useFinancialIntelligence";
import { todayLocalISO } from "../data/dates";
import { useDataVersion } from "../data/DataVersionProvider";
import { formatINR, toPaiseStrict } from "../lib/money";
import {
  computeMoneyOverview,
  createPeerDebt,
  createPerson,
  listDebtSettlements,
  listPeerDebts,
  listPeople,
  recordDebtSettlement,
  recordGiftTransaction,
  type MoneyOverview,
} from "../services/peerDebts";
import { listGroupSplits } from "../services/groupExpenses";
import type { DebtSettlement, GroupExpenseSplit, PeerDebt, PeerDebtDirection, Person } from "../types/contracts";
import { Button, Card, Chip, Field, MoneyInput, Notice, Screen, SectionTitle, Segmented, SelectInput, Skeleton, TextInput, cx, formatDay } from "../ui/kit";
import { IconCheckCircle, IconChevronRight, IconPlus } from "../ui/icons";

type MoneyTab = "receive" | "repay";

function parseRupees(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  try {
    const p = toPaiseStrict(cleaned);
    return p > 0 ? p : null;
  } catch {
    return null;
  }
}

export function MoneyScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { version, bump } = useDataVersion();
  const { data: intel, loading: intelLoading } = useFinancialIntelligence({ horizonDays: 30 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<PeerDebt[]>([]);
  const [settlements, setSettlements] = useState<DebtSettlement[]>([]);
  const [groupSplits, setGroupSplits] = useState<GroupExpenseSplit[]>([]);
  const [tab, setTab] = useState<MoneyTab>("receive");

  // Read-only repayment budget simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simCadence, setSimCadence] = useState<"daily" | "weekly">("daily");
  const [simBudgetInput, setSimBudgetInput] = useState("");

  // Record Borrowing / Lending / Gift state
  const [showRecord, setShowRecord] = useState(false);
  const [entryKind, setEntryKind] = useState<"loan" | "gift">("loan");
  const [giftDir, setGiftDir] = useState<"received" | "given">("received");
  const [recordDir, setRecordDir] = useState<PeerDebtDirection>("they_owe");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [quickPersonName, setQuickPersonName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dateInput, setDateInput] = useState(todayLocalISO());
  const [dueDateInput, setDueDateInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [confirmPreview, setConfirmPreview] = useState(false);
  const [recordErr, setRecordErr] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  // Repayment / Settlement state
  const [settlingDebt, setSettlingDebt] = useState<(PeerDebt & { personName: string }) | null>(null);
  const [settleAmountInput, setSettleAmountInput] = useState("");
  const [settleDateInput, setSettleDateInput] = useState(todayLocalISO());
  const [settleNoteInput, setSettleNoteInput] = useState("");
  const [settleErr, setSettleErr] = useState<string | null>(null);
  const [savingSettle, setSavingSettle] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, d, s, gs] = await Promise.all([
        listPeople(),
        listPeerDebts(),
        listDebtSettlements(),
        listGroupSplits().catch(() => [] as GroupExpenseSplit[]),
      ]);
      setPeople(p);
      setDebts(d);
      setSettlements(s);
      setGroupSplits(gs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load money records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  // Handle deep-linked actions from PeopleScreen (?mode=lend|borrow&personId=... or ?settle=...)
  useEffect(() => {
    const mode = searchParams.get("mode");
    const pId = searchParams.get("personId");
    const settleId = searchParams.get("settle");

    if (mode === "lend" || mode === "borrow") {
      setRecordDir(mode === "lend" ? "they_owe" : "you_owe");
      if (pId) setSelectedPersonId(pId);
      setShowRecord(true);
      setConfirmPreview(false);
      setSearchParams({}, { replace: true });
    } else if (settleId && debts.length > 0) {
      const target = debts.find((d) => d.id === settleId);
      if (target) {
        const pName = people.find((p) => p.id === target.person_id)?.name ?? "Person";
        setSettlingDebt({ ...target, personName: pName });
        setSettleAmountInput("");
        setSettleErr(null);
        setTab(target.direction === "they_owe" ? "receive" : "repay");
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, debts, people]);

  const overview: MoneyOverview = useMemo(
    () => computeMoneyOverview(people, debts, groupSplits),
    [people, debts, groupSplits]
  );
  const items = tab === "receive" ? overview.receivables : overview.payables;
  const activeReceiveCount = useMemo(
    () => overview.receivables.filter((d) => d.status === "active" || d.status === "partially_settled").length,
    [overview.receivables]
  );
  const activeRepayCount = useMemo(
    () => overview.payables.filter((d) => d.status === "active" || d.status === "partially_settled").length,
    [overview.payables]
  );

  const simulatedDailyBudgetPaise = useMemo(() => {
    const parsed = parseRupees(simBudgetInput);
    if (!parsed || parsed <= 0) return null;
    return simCadence === "weekly" ? Math.max(1, Math.round(parsed / 7)) : parsed;
  }, [simBudgetInput, simCadence]);

  const planner = useMemo(() => {
    const today = intel?.todayISO ?? todayLocalISO();
    return buildDebtPlannerModel({
      debtPlan: intel?.debtPlan ?? null,
      safeToSpend: intel?.safeToSpend ?? null,
      peerDebts: debts.map((d) => ({
        id: d.id,
        personId: d.person_id,
        personName: people.find((p) => p.id === d.person_id)?.name,
        direction: d.direction,
        totalAmountPaise: d.total_amount_paise,
        remainingAmountPaise: d.remaining_amount_paise,
        status: d.status,
        dueDate: d.due_date,
        createdAt: d.created_at,
      })),
      groupSplits: groupSplits.map((gs) => ({
        id: gs.id,
        groupExpenseId: gs.group_expense_id,
        isSelf: gs.is_self,
        personId: gs.person_id,
        direction: gs.direction,
        shareAmountPaise: gs.share_amount_paise,
        remainingAmountPaise: gs.remaining_amount_paise,
        status: gs.status,
        createdAt: gs.created_at,
      })),
      todayISO: today,
      simulatedDailyBudgetPaise,
    });
  }, [intel, debts, people, groupSplits, simulatedDailyBudgetPaise]);

  function openNewRecord(dir: PeerDebtDirection) {
    setEntryKind("loan");
    setGiftDir("received");
    setRecordDir(dir);
    setSelectedPersonId(people[0]?.id ?? "__new__");
    setQuickPersonName("");
    setAmountInput("");
    setDateInput(todayLocalISO());
    setDueDateInput("");
    setNoteInput("");
    setConfirmPreview(false);
    setRecordErr(null);
    setShowRecord(true);
  }

  function handlePreviewRecord() {
    setRecordErr(null);
    const paise = parseRupees(amountInput);
    if (!paise || paise <= 0) {
      setRecordErr("Enter a valid amount greater than ₹0.");
      return;
    }
    if (entryKind === "loan" && (selectedPersonId === "__new__" || !selectedPersonId)) {
      if (!quickPersonName.trim()) {
        setRecordErr("Select a person or enter a new person's name.");
        return;
      }
    }
    setConfirmPreview(true);
  }

  async function handleConfirmRecord() {
    setRecordErr(null);
    const paise = parseRupees(amountInput);
    if (!paise || paise <= 0) {
      setRecordErr("Invalid amount.");
      return;
    }
    setSavingRecord(true);
    try {
      if (entryKind === "gift") {
        const pName =
          selectedPersonId && selectedPersonId !== "__new__"
            ? people.find((p) => p.id === selectedPersonId)?.name ?? null
            : quickPersonName.trim() || null;
        await recordGiftTransaction({
          direction: giftDir,
          amountPaise: paise,
          personName: pName,
          date: dateInput,
          note: noteInput || null,
        });
        setShowRecord(false);
        setConfirmPreview(false);
        bump();
        return;
      }

      let personId = selectedPersonId;
      if (!personId || personId === "__new__") {
        const created = await createPerson({ name: quickPersonName.trim() });
        personId = created.id;
      }
      await createPeerDebt({
        personId,
        direction: recordDir,
        totalAmountPaise: paise,
        dueDate: dueDateInput || null,
        reason: noteInput || null,
        createdAt: `${dateInput}T12:00:00Z`,
      });
      setShowRecord(false);
      setConfirmPreview(false);
      setTab(recordDir === "they_owe" ? "receive" : "repay");
      bump();
    } catch (err) {
      setRecordErr(err instanceof Error ? err.message : "Could not save record.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleConfirmSettlement() {
    if (!settlingDebt) return;
    setSettleErr(null);
    const paise = parseRupees(settleAmountInput);
    if (!paise || paise <= 0) {
      setSettleErr("Enter a repayment amount greater than ₹0.");
      return;
    }
    if (paise > settlingDebt.remaining_amount_paise) {
      setSettleErr(`Amount cannot exceed remaining ${formatINR(settlingDebt.remaining_amount_paise)}.`);
      return;
    }
    setSavingSettle(true);
    try {
      await recordDebtSettlement(settlingDebt, {
        direction: settlingDebt.direction === "you_owe" ? "repayment_out" : "repayment_in",
        amountPaise: paise,
        settledAt: `${settleDateInput}T12:00:00Z`,
        notes: settleNoteInput || null,
      });
      setSettlingDebt(null);
      bump();
    } catch (err) {
      setSettleErr(err instanceof Error ? err.message : "Could not record repayment.");
    } finally {
      setSavingSettle(false);
    }
  }

  const previewPersonName =
    selectedPersonId && selectedPersonId !== "__new__"
      ? people.find((p) => p.id === selectedPersonId)?.name ?? "Person"
      : quickPersonName.trim();
  const previewPaise = parseRupees(amountInput) ?? 0;

  return (
    <Screen
      title="Money"
      subtitle="Borrowing, lending and repayments"
      right={
        <button
          type="button"
          onClick={() => openNewRecord(tab === "receive" ? "they_owe" : "you_owe")}
          aria-label="Record borrow or lend"
          className="h-9 px-3 rounded-full bg-brand-700 text-white text-[13px] font-semibold inline-flex items-center gap-1"
        >
          <IconPlus size={16} /> Record
        </button>
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {/* Quick navigation pills so Insights, WISH, Groups, and Bills are 1-tap reachable */}
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Link to="/groups" className="shrink-0 h-8 px-3 rounded-full bg-white border border-line text-[12.5px] font-semibold text-ink inline-flex items-center">
          Groups
        </Link>
        <Link to="/insights" className="shrink-0 h-8 px-3 rounded-full bg-white border border-line text-[12.5px] font-semibold text-ink inline-flex items-center">
          Insights
        </Link>
        <Link to="/wish" className="shrink-0 h-8 px-3 rounded-full bg-white border border-line text-[12.5px] font-semibold text-ink inline-flex items-center">
          WISH goals
        </Link>
        <Link to="/commitments" className="shrink-0 h-8 px-3 rounded-full bg-white border border-line text-[12.5px] font-semibold text-ink inline-flex items-center">
          Bills
        </Link>
      </div>

      {/* Top Totals: Receivables vs Payables */}
      <div className="grid grid-cols-2 gap-3">
        <Card tone="brand" className="p-3.5 space-y-1">
          <p className="text-xs font-semibold text-brand-800">Others owe you</p>
          <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(overview.totalToReceivePaise)}</p>
          <p className="text-[11px] text-ink-muted">
            Personal {formatINR(overview.personalToReceivePaise)} · Group {formatINR(overview.groupToReceivePaise)}
          </p>
        </Card>
        <Card tone="warn" className="p-3.5 space-y-1">
          <p className="text-xs font-semibold text-amber-900">Total you owe</p>
          <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(overview.totalToRepayPaise)}</p>
          <p className="text-[11px] text-ink-muted">
            Personal {formatINR(overview.personalToRepayPaise)} · Group {formatINR(overview.groupToRepayPaise)}
          </p>
        </Card>
      </div>

      {/* Confirmed Cash vs Sustainable Capital summary */}
      {intel && intel.confirmedCashPaise !== null ? (
        <Card tone="soft" className="px-4 py-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-ink-muted">{FINANCIAL_TERMS.confirmedCash.label}</p>
            <p className="text-[14px] font-bold tabular-nums text-ink">
              {formatFinancialAmount(intel.confirmedCashPaise)}
            </p>
          </div>
          <div>
            <p className="text-ink-muted">{FINANCIAL_TERMS.safeToSpend.label}</p>
            <p className="text-[14px] font-bold tabular-nums text-ink">
              {formatFinancialAmount(intel.safeToSpendPaise)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-ink-muted">{FINANCIAL_TERMS.sustainableCapital.label}</p>
            <p className="text-[14px] font-bold tabular-nums text-ink">
              {formatFinancialAmount(intel.sustainableCapitalPaise)}
            </p>
          </div>
        </Card>
      ) : null}

      {/* Debt Repayment Planner & Read-Only Budget Simulator */}
      {intelLoading && !intel ? (
        <Skeleton className="h-32" />
      ) : planner.hasDebts ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold text-ink">Repayment planner</h2>
              <p className="text-[11.5px] text-ink-muted">
                Receivables ({formatINR(planner.totalReceivablePaise)}) are kept separate and not used for repayment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulator((v) => !v)}
              className="shrink-0 h-8 px-3 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold"
            >
              {showSimulator ? "Hide simulator" : "Explore budget"}
            </button>
          </div>

          {planner.overdueTotalPaise > 0 ? (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs font-semibold text-red-800">
              {formatINR(planner.overdueTotalPaise)} overdue across {planner.overdueCount} obligation{planner.overdueCount === 1 ? "" : "s"} — prioritized first.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F1F3EE] p-3 text-xs">
            <div>
              <p className="text-ink-muted">Suggested set-aside</p>
              <p className="mt-0.5 text-[15px] font-extrabold tabular-nums text-ink">
                {formatINR(planner.recommendedDailySetAsidePaise)}/day
              </p>
              <p className="text-[11px] text-ink-muted">
                {formatINR(planner.recommendedWeeklySetAsidePaise)}/week
              </p>
            </div>
            <div className="text-right">
              <p className="text-ink-muted">Est. payoff timeline</p>
              <p className="mt-0.5 text-[15px] font-extrabold tabular-nums text-ink">
                {planner.totalPayoffDays !== null ? `${planner.totalPayoffDays} day${planner.totalPayoffDays === 1 ? "" : "s"}` : "—"}
              </p>
              <p className="text-[11px] text-ink-muted">
                {planner.estimatedPayoffDate ? `By ${formatDay(planner.estimatedPayoffDate)}` : "Needs repayment budget"}
              </p>
            </div>
          </div>

          {planner.obligations.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-ink-soft">Priority order</p>
              <div className="divide-y divide-line rounded-xl border border-line bg-white">
                {planner.obligations.slice(0, 4).map((ob) => (
                  <div key={`${ob.source}-${ob.id}`} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">
                        {ob.creditorName} · <span className="font-normal text-ink-muted">{ob.source === "group_split" ? "Group split" : "Personal"}</span>
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {ob.dueDate ? `Due ${formatDay(ob.dueDate)}` : "No due date"}
                        {ob.urgency === "overdue" ? " · Overdue" : ob.urgency === "due_soon" ? " · Due soon" : ""}
                      </p>
                    </div>
                    <span className={cx("font-bold tabular-nums shrink-0", ob.urgency === "overdue" ? "text-red-700" : "text-ink")}>
                      {formatINR(ob.remainingAmountPaise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showSimulator ? (
            <div className="pt-2 border-t border-line space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ink">Explore repayment budget (simulation only)</p>
                <Segmented
                  size="sm"
                  value={simCadence}
                  onChange={setSimCadence}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                  ]}
                />
              </div>
              <Field label={`Test ${simCadence} repayment amount`}>
                {(id) => (
                  <MoneyInput
                    id={id}
                    value={simBudgetInput}
                    onChange={setSimBudgetInput}
                    placeholder={simCadence === "daily" ? "e.g. 200" : "e.g. 1400"}
                  />
                )}
              </Field>
              {planner.simulation ? (
                <div className="rounded-xl bg-brand-50/70 border border-brand-100 p-3 space-y-1 text-xs">
                  <p className="font-semibold text-brand-900">
                    Simulated result (does not record a payment):
                  </p>
                  <p className="text-ink">
                    At {formatINR(planner.simulation.dailyBudgetPaise)}/day ({formatINR(planner.simulation.weeklyBudgetPaise)}/week):{" "}
                    <strong>
                      {planner.simulation.totalPayoffDays !== null
                        ? `${planner.simulation.totalPayoffDays} day${planner.simulation.totalPayoffDays === 1 ? "" : "s"}`
                        : "—"}
                    </strong>
                    {planner.simulation.estimatedPayoffDate ? ` (by ${formatDay(planner.simulation.estimatedPayoffDate)})` : ""}
                  </p>
                  {planner.simulation.missedDueDatesCount > 0 ? (
                    <p className="text-amber-800">
                      {planner.simulation.missedDueDatesCount} due date{planner.simulation.missedDueDatesCount === 1 ? "" : "s"} may be missed at this pace.
                    </p>
                  ) : null}
                  {planner.simulation.exceedsSafeToSpendDaily || planner.simulation.exceedsAvailableSafeToSpend ? (
                    <p className="text-red-700 font-semibold">
                      Exceeds your current safe-to-spend allowance
                      {planner.simulation.safeDailyAllowancePaise !== null
                        ? ` (${formatINR(planner.simulation.safeDailyAllowancePaise)}/day)`
                        : ""} — may cause an immediate shortfall.
                    </p>
                  ) : planner.simulation.safeDailyAllowancePaise !== null ? (
                    <p className="text-brand-800">
                      Fits within your daily safe-to-spend allowance ({formatINR(planner.simulation.safeDailyAllowancePaise)}/day).
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[11.5px] text-ink-muted">Enter an amount above to simulate payoff duration without changing any records.</p>
              )}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Record Borrowing / Lending Flow with Mandatory Confirmation Preview */}
      {showRecord ? (
        <Card className="p-4 space-y-3">
          <SectionTitle>{confirmPreview ? "Confirm before saving" : "Record borrowing or lending"}</SectionTitle>
          {recordErr ? <Notice tone="danger">{recordErr}</Notice> : null}

          {confirmPreview ? (
            <div className="space-y-3">
              <Card tone="soft" className="p-3.5 space-y-1">
                <p className="text-xs font-semibold text-ink-soft">
                  {entryKind === "gift"
                    ? giftDir === "received"
                      ? "Gift received (non-repayable, not earned income)"
                      : "Gift given (expense, not a receivable)"
                    : recordDir === "they_owe"
                      ? "Lending (Money to receive)"
                      : "Borrowing (Money to repay)"}
                </p>
                <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(previewPaise)}</p>
                <p className="text-[13px] text-ink">
                  {entryKind === "gift"
                    ? giftDir === "received"
                      ? `Gift received${previewPersonName ? ` from ${previewPersonName}` : ""}`
                      : `Gift given${previewPersonName ? ` to ${previewPersonName}` : ""}`
                    : recordDir === "they_owe"
                      ? `You lent ${formatINR(previewPaise)} to ${previewPersonName}`
                      : `You borrowed ${formatINR(previewPaise)} from ${previewPersonName}`}
                </p>
                <p className="text-xs text-ink-muted">
                  Date: {formatDay(dateInput)}
                  {entryKind === "loan" && dueDateInput ? ` · Due: ${formatDay(dueDateInput)}` : ""}
                  {noteInput ? ` · ${noteInput}` : ""}
                </p>
              </Card>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmPreview(false)}>Edit</Button>
                <Button loading={savingRecord} icon={<IconCheckCircle size={18} />} onClick={handleConfirmRecord}>
                  Confirm & save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Segmented
                value={entryKind}
                onChange={setEntryKind}
                size="sm"
                options={[
                  { value: "loan", label: "Loan (to repay)" },
                  { value: "gift", label: "Gift (no repayment)" },
                ]}
              />

              {entryKind === "loan" ? (
                <Segmented
                  value={recordDir}
                  onChange={setRecordDir}
                  options={[
                    { value: "they_owe", label: "I lent money" },
                    { value: "you_owe", label: "I borrowed" },
                  ]}
                />
              ) : (
                <Segmented
                  value={giftDir}
                  onChange={setGiftDir}
                  options={[
                    { value: "received", label: "Gift received" },
                    { value: "given", label: "Gift given" },
                  ]}
                />
              )}

              <Field label="Person">
                {(id) => (
                  <SelectInput
                    id={id}
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="__new__">+ Add new person</option>
                  </SelectInput>
                )}
              </Field>

              {selectedPersonId === "__new__" || people.length === 0 ? (
                <Field label="New person's name">
                  {(id) => (
                    <TextInput
                      id={id}
                      value={quickPersonName}
                      onChange={(e) => setQuickPersonName(e.target.value)}
                      placeholder="e.g. Ahmed"
                    />
                  )}
                </Field>
              ) : null}

              <Field label="Amount">
                {(id) => <MoneyInput id={id} value={amountInput} onChange={setAmountInput} large />}
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Date">
                  {(id) => <TextInput id={id} type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />}
                </Field>
                <Field label="Due date (optional)">
                  {(id) => <TextInput id={id} type="date" value={dueDateInput} onChange={(e) => setDueDateInput(e.target.value)} />}
                </Field>
              </div>

              <Field label="Note (optional)">
                {(id) => <TextInput id={id} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="e.g. Medical help, Rent" />}
              </Field>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="secondary" onClick={() => setShowRecord(false)}>Cancel</Button>
                <Button onClick={handlePreviewRecord}>Review & confirm</Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {/* Repayment / Settlement Card */}
      {settlingDebt ? (
        <Card className="p-4 space-y-3 border-brand-200">
          <SectionTitle>
            {settlingDebt.direction === "they_owe"
              ? `Received from ${settlingDebt.personName}`
              : `Repay ${settlingDebt.personName}`}
          </SectionTitle>
          <p className="text-xs text-ink-soft">
            Original: {formatINR(settlingDebt.total_amount_paise)} · Remaining:{" "}
            <strong className="text-ink">{formatINR(settlingDebt.remaining_amount_paise)}</strong>
          </p>
          {settleErr ? <Notice tone="danger">{settleErr}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Chip
              active={parseRupees(settleAmountInput) === settlingDebt.remaining_amount_paise}
              onClick={() => setSettleAmountInput((settlingDebt.remaining_amount_paise / 100).toString())}
            >
              Full ({formatINR(settlingDebt.remaining_amount_paise)})
            </Chip>
          </div>
          <Field label="Repayment amount">
            {(id) => <MoneyInput id={id} value={settleAmountInput} onChange={setSettleAmountInput} large />}
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Date">
              {(id) => <TextInput id={id} type="date" value={settleDateInput} onChange={(e) => setSettleDateInput(e.target.value)} />}
            </Field>
            <Field label="Note (optional)">
              {(id) => <TextInput id={id} value={settleNoteInput} onChange={(e) => setSettleNoteInput(e.target.value)} placeholder="e.g. Cash / UPI" />}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSettlingDebt(null)}>Cancel</Button>
            <Button loading={savingSettle} onClick={handleConfirmSettlement}>Confirm repayment</Button>
          </div>
        </Card>
      ) : null}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "receive", label: `To Receive (${activeReceiveCount})` },
          { value: "repay", label: `To Repay (${activeRepayCount})` },
        ]}
      />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <p className="text-[15px] font-bold text-ink">
            {tab === "receive" ? "No money to receive" : "No money to repay"}
          </p>
          <p className="text-xs text-ink-muted">
            {tab === "receive"
              ? "When you lend money to someone, it will appear here."
              : "When you borrow money from someone, it will appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((d) => {
            const dSettlements = settlements.filter((s) => s.debt_id === d.id);
            return (
              <Card key={d.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/people/${d.person_id}`} className="text-[15px] font-bold text-ink hover:underline">
                      {d.personName}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      Original: {formatINR(d.total_amount_paise)}
                      {d.due_date ? ` · Due ${formatDay(d.due_date)}` : ""}
                    </p>
                  </div>
                  <span
                    className={cx(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0",
                      d.status === "settled"
                        ? "bg-brand-50 text-brand-700"
                        : d.status === "partially_settled"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[#F1F3EE] text-ink-soft"
                    )}
                  >
                    {d.status === "partially_settled" ? "Partially settled" : d.status === "settled" ? "Settled" : "Pending"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-line">
                  <div>
                    <span className="text-ink-muted">{tab === "receive" ? "Received" : "Repaid"}: </span>
                    <span className="font-semibold text-ink">{formatINR(d.settledPaise)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-ink-muted">Remaining: </span>
                    <span className="font-bold text-ink">{formatINR(d.remaining_amount_paise)}</span>
                  </div>
                </div>

                {dSettlements.length > 0 ? (
                  <p className="text-[11px] text-ink-muted">
                    {dSettlements.length} repayment{dSettlements.length === 1 ? "" : "s"} recorded (latest{" "}
                    {formatDay(dSettlements[0].settled_at.slice(0, 10))})
                  </p>
                ) : null}

                {d.remaining_amount_paise > 0 ? (
                  <Button
                    variant="secondary"
                    className="h-10 text-[13px]"
                    onClick={() => {
                      setSettlingDebt(d);
                      setSettleAmountInput("");
                      setSettleErr(null);
                    }}
                  >
                    {tab === "receive" ? "Record money received" : "Record repayment"}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* Additional money tools not in top quick-jump pills */}
      <SectionTitle>Other money tools</SectionTitle>
      <Card className="divide-y divide-line">
        <Link to="/payouts" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Expected platform payouts</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/invoices" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Client invoices</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/more" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>More & settings</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
      </Card>
    </Screen>
  );
}
