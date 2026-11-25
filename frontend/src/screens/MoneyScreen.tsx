// Money — Clear separation of Money to Receive (receivables), Money to Repay (liabilities),
// Available Liquidity vs Sustainable Capital, and confirmation-gated Borrowing/Lending/Repayments.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useDataVersion } from "../data/DataVersionProvider";
import { formatINR, toPaiseStrict } from "../lib/money";
import { useRunway } from "../runway/useRunway";
import {
  computeMoneyOverview,
  createPeerDebt,
  createPerson,
  listDebtSettlements,
  listPeerDebts,
  listPeople,
  recordDebtSettlement,
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
  const { runway } = useRunway({ horizonDays: 30 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [debts, setDebts] = useState<PeerDebt[]>([]);
  const [settlements, setSettlements] = useState<DebtSettlement[]>([]);
  const [groupSplits, setGroupSplits] = useState<GroupExpenseSplit[]>([]);
  const [tab, setTab] = useState<MoneyTab>("receive");

  // Record Borrowing / Lending state
  const [showRecord, setShowRecord] = useState(false);
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

  function openNewRecord(dir: PeerDebtDirection) {
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
    if (selectedPersonId === "__new__" || !selectedPersonId) {
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

      {/* Top Totals: Receivables vs Payables */}
      <div className="grid grid-cols-2 gap-3">
        <Card tone="brand" className="p-3.5 space-y-1">
          <p className="text-xs font-semibold text-brand-800">Money to receive</p>
          <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(overview.totalToReceivePaise)}</p>
          <p className="text-[11px] text-ink-muted">
            Personal {formatINR(overview.personalToReceivePaise)} · Group {formatINR(overview.groupToReceivePaise)}
          </p>
        </Card>
        <Card tone="warn" className="p-3.5 space-y-1">
          <p className="text-xs font-semibold text-amber-900">Money to repay</p>
          <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(overview.totalToRepayPaise)}</p>
          <p className="text-[11px] text-ink-muted">
            Personal {formatINR(overview.personalToRepayPaise)} · Group {formatINR(overview.groupToRepayPaise)}
          </p>
        </Card>
      </div>

      {/* Available Liquidity vs Sustainable Capital summary */}
      {runway && runway.confirmedBalancePaise !== null ? (
        <Card tone="soft" className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-ink-muted">Available liquidity</p>
            <p className="text-[15px] font-bold tabular-nums text-ink">
              {formatINR(runway.availableLiquidityPaise ?? runway.startingSpendableBalancePaise ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-ink-muted">Debt-free capital</p>
            <p className="text-[15px] font-bold tabular-nums text-ink">
              {formatINR(runway.sustainableCapitalPaise ?? 0)}
            </p>
          </div>
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
                  {recordDir === "they_owe" ? "Lending (Money to receive)" : "Borrowing (Money to repay)"}
                </p>
                <p className="text-[22px] font-extrabold tabular-nums text-ink">{formatINR(previewPaise)}</p>
                <p className="text-[13px] text-ink">
                  {recordDir === "they_owe"
                    ? `You lent ${formatINR(previewPaise)} to ${previewPersonName}`
                    : `You borrowed ${formatINR(previewPaise)} from ${previewPersonName}`}
                </p>
                <p className="text-xs text-ink-muted">
                  Date: {formatDay(dateInput)}
                  {dueDateInput ? ` · Due: ${formatDay(dueDateInput)}` : ""}
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
                value={recordDir}
                onChange={setRecordDir}
                options={[
                  { value: "they_owe", label: "I lent money" },
                  { value: "you_owe", label: "I borrowed" },
                ]}
              />

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
          { value: "receive", label: `To Receive (${overview.receivables.length})` },
          { value: "repay", label: `To Repay (${overview.payables.length})` },
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

      {/* Preserve easy access to existing v1.0.1 Money Planning features */}
      <SectionTitle>Other money tools</SectionTitle>
      <Card className="divide-y divide-line">
        <Link to="/groups" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Group expenses & bill splits</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/commitments" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Bills & upcoming commitments</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/payouts" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Expected platform payouts</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/invoices" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Client invoices</span>
          <IconChevronRight size={18} className="text-ink-faint" />
        </Link>
        <Link to="/insights" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink">
          <span>Insights & WISH goals</span>
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
