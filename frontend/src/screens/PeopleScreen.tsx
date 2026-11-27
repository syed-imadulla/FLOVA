// People — Track everyone you lend to or borrow from, with full history and zero-balance support.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { formatINR, toPaiseStrict } from "../lib/money";
import { useDataVersion } from "../data/DataVersionProvider";
import {
  computePeopleSummaries,
  createPerson,
  deletePeerDebt,
  deletePerson,
  listDebtSettlements,
  listPeerDebts,
  listPeople,
  reverseDebtSettlement,
  updatePeerDebt,
  updatePerson,
  type PersonFinancialSummary,
} from "../services/peerDebts";
import { listGroupExpenses, listGroupSettlements, listGroupSplits } from "../services/groupExpenses";
import type { GroupExpense, GroupExpenseSplit, GroupSettlement, PeerDebt } from "../types/contracts";
import { Button, Card, Field, MoneyInput, Notice, Screen, SectionTitle, SelectInput, Skeleton, TextInput, cx, formatDay } from "../ui/kit";
import { IconChevronRight, IconPencil, IconPlus, IconTrash, IconUser } from "../ui/icons";

export function PeopleScreen() {
  const { personId } = useParams<{ personId?: string }>();
  const navigate = useNavigate();
  const { version, bump } = useDataVersion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<PersonFinancialSummary[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Add / Edit Person form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  // Debt edit / delete / settlement reversal state
  const [editingDebt, setEditingDebt] = useState<PeerDebt | null>(null);
  const [editDebtPersonId, setEditDebtPersonId] = useState("");
  const [editDebtAmount, setEditDebtAmount] = useState("");
  const [editDebtDue, setEditDebtDue] = useState("");
  const [editDebtReason, setEditDebtReason] = useState("");
  const [editDebtErr, setEditDebtErr] = useState<string | null>(null);
  const [savingDebt, setSavingDebt] = useState(false);
  const [confirmDeleteDebtId, setConfirmDeleteDebtId] = useState<string | null>(null);
  const [confirmReverseId, setConfirmReverseId] = useState<string | null>(null);
  const [debtActionErr, setDebtActionErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [people, debts, settlements, gExpenses, gSplits, gSettlements] = await Promise.all([
        listPeople(),
        listPeerDebts(),
        listDebtSettlements(),
        listGroupExpenses().catch(() => [] as GroupExpense[]),
        listGroupSplits().catch(() => [] as GroupExpenseSplit[]),
        listGroupSettlements().catch(() => [] as GroupSettlement[]),
      ]);
      const payerMap = new Map(gExpenses.map((e) => [e.id, e.paid_by_self ? null : e.paid_by_person_id]));
      setSummaries(computePeopleSummaries(people, debts, settlements, gSplits, gSettlements, payerMap));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load people.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter(
      (s) =>
        s.person.name.toLowerCase().includes(q) ||
        (s.person.phone && s.person.phone.includes(q)) ||
        (s.person.relationship && s.person.relationship.toLowerCase().includes(q))
    );
  }, [summaries, search]);

  const selected = useMemo(
    () => (personId ? summaries.find((s) => s.person.id === personId) ?? null : null),
    [personId, summaries]
  );

  function openAdd() {
    setEditingId(null);
    setNameInput("");
    setPhoneInput("");
    setNoteInput("");
    setFormErr(null);
    setShowAdd(true);
  }

  function openEdit(s: PersonFinancialSummary) {
    setEditingId(s.person.id);
    setNameInput(s.person.name);
    setPhoneInput(s.person.phone ?? "");
    setNoteInput(s.person.relationship ?? "");
    setFormErr(null);
    setShowAdd(true);
  }

  async function handleSavePerson() {
    setFormErr(null);
    if (!nameInput.trim()) {
      setFormErr("Please enter a name.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePerson(editingId, {
          name: nameInput,
          phone: phoneInput || null,
          relationship: noteInput || null,
        });
      } else {
        await createPerson({
          name: nameInput,
          phone: phoneInput || null,
          relationship: noteInput || null,
        });
      }
      setShowAdd(false);
      bump();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Could not save person.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePerson(id: string) {
    setDeleteErr(null);
    try {
      await deletePerson(id);
      bump();
      navigate("/people", { replace: true });
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : "Could not delete person.");
    }
  }

  function openEditDebt(d: PeerDebt) {
    setEditingDebt(d);
    setEditDebtPersonId(d.person_id);
    setEditDebtAmount((d.total_amount_paise / 100).toString());
    setEditDebtDue(d.due_date ?? "");
    setEditDebtReason(d.reason ?? "");
    setEditDebtErr(null);
  }

  async function handleSaveDebtEdit() {
    if (!editingDebt) return;
    setEditDebtErr(null);
    let paise = 0;
    try {
      paise = toPaiseStrict(editDebtAmount.replace(/,/g, "").trim());
    } catch {
      paise = 0;
    }
    if (!paise || paise <= 0) {
      setEditDebtErr("Enter a valid original amount greater than ₹0.");
      return;
    }
    setSavingDebt(true);
    try {
      await updatePeerDebt({
        debtId: editingDebt.id,
        personId: editDebtPersonId,
        totalAmountPaise: paise,
        dueDate: editDebtDue || null,
        reason: editDebtReason || null,
      });
      setEditingDebt(null);
      bump();
    } catch (err) {
      setEditDebtErr(err instanceof Error ? err.message : "Could not update debt.");
    } finally {
      setSavingDebt(false);
    }
  }

  async function handleDeleteDebt(debtId: string) {
    setDebtActionErr(null);
    try {
      await deletePeerDebt(debtId);
      setConfirmDeleteDebtId(null);
      bump();
    } catch (err) {
      setDebtActionErr(err instanceof Error ? err.message : "Could not delete debt.");
    }
  }

  async function handleReverseSettlement(settlementId: string) {
    setDebtActionErr(null);
    try {
      await reverseDebtSettlement(settlementId);
      setConfirmReverseId(null);
      bump();
    } catch (err) {
      setDebtActionErr(err instanceof Error ? err.message : "Could not reverse repayment.");
    }
  }

  // Detail View for a single person
  if (personId) {
    if (loading) {
      return (
        <Screen title="Person details" back="/people">
          <Skeleton className="h-32" />
          <Skeleton className="h-44" />
        </Screen>
      );
    }
    if (!selected) {
      return (
        <Screen title="Person not found" back="/people">
          <Notice tone="warn">This person could not be found.</Notice>
        </Screen>
      );
    }

    const { person } = selected;
    const today = todayLocalISO();
    const overduePayablePaise = selected.debts
      .filter((d) => d.direction === "you_owe" && d.remaining_amount_paise > 0 && d.due_date && d.due_date < today)
      .reduce((acc, d) => acc + d.remaining_amount_paise, 0);
    const hasPersonal = selected.personalReceivablePaise > 0 || selected.personalPayablePaise > 0;
    const hasGroup = selected.groupReceivablePaise > 0 || selected.groupPayablePaise > 0;

    return (
      <Screen
        title={person.name}
        subtitle={person.phone || person.relationship || "No phone added"}
        back="/people"
        right={
          <button
            type="button"
            onClick={() => openEdit(selected)}
            aria-label="Edit person"
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-black/5"
          >
            <IconPencil size={18} />
          </button>
        }
      >
        {showAdd ? (
          <Card className="p-4 space-y-3">
            <SectionTitle>Edit person</SectionTitle>
            {formErr ? <Notice tone="danger">{formErr}</Notice> : null}
            <Field label="Name">
              {(id) => <TextInput id={id} value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Ahmed" />}
            </Field>
            <Field label="Phone (optional)">
              {(id) => <TextInput id={id} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Optional mobile number" inputMode="tel" />}
            </Field>
            <Field label="Note / Relationship (optional)">
              {(id) => <TextInput id={id} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="e.g. Friend, Roommate" />}
            </Field>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSavePerson}>Save</Button>
            </div>
          </Card>
        ) : null}

        <Card
          tone={selected.netBalancePaise > 0 ? "brand" : selected.netBalancePaise < 0 ? "warn" : "soft"}
          className="p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-ink-soft">Current balance</p>
          <p className="text-[26px] font-extrabold tabular-nums text-ink">
            {selected.netBalancePaise === 0 ? "₹0" : formatINR(Math.abs(selected.netBalancePaise))}
          </p>
          <p className="text-[13px] font-medium text-ink-soft">{selected.statusLabel}</p>
          {(hasPersonal || hasGroup) ? (
            <div className="pt-2 border-t border-black/10 grid grid-cols-2 gap-2 text-[11.5px] text-ink-soft">
              <div>
                <span className="font-semibold text-ink">Personal:</span>{" "}
                {selected.personalReceivablePaise > 0
                  ? `+${formatINR(selected.personalReceivablePaise)}`
                  : selected.personalPayablePaise > 0
                    ? `−${formatINR(selected.personalPayablePaise)}`
                    : "₹0"}
              </div>
              <div className="text-right">
                <span className="font-semibold text-ink">Group splits:</span>{" "}
                {selected.groupReceivablePaise > 0
                  ? `+${formatINR(selected.groupReceivablePaise)}`
                  : selected.groupPayablePaise > 0
                    ? `−${formatINR(selected.groupPayablePaise)}`
                    : "₹0"}
              </div>
            </div>
          ) : null}
          {overduePayablePaise > 0 ? (
            <p className="text-xs font-semibold text-red-700">
              Overdue to repay: {formatINR(overduePayablePaise)}
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <p className="text-xs text-ink-muted">Total lent</p>
            <p className="text-[17px] font-bold tabular-nums text-ink">{formatINR(selected.totalLentPaise)}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Received: {formatINR(selected.totalReceivedPaise)}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-xs text-ink-muted">Total borrowed</p>
            <p className="text-[17px] font-bold tabular-nums text-ink">{formatINR(selected.totalBorrowedPaise)}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Repaid: {formatINR(selected.totalRepaidPaise)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to={`/money?mode=lend&personId=${person.id}`}
            className="h-11 rounded-xl bg-brand-700 text-white text-[14px] font-semibold flex items-center justify-center"
          >
            + I lent money
          </Link>
          <Link
            to={`/money?mode=borrow&personId=${person.id}`}
            className="h-11 rounded-xl bg-white border border-line text-ink text-[14px] font-semibold flex items-center justify-center"
          >
            + I borrowed
          </Link>
        </div>

        <SectionTitle>History ({selected.debts.length})</SectionTitle>
        {debtActionErr ? <Notice tone="danger">{debtActionErr}</Notice> : null}
        {editingDebt ? (
          <Card className="p-4 space-y-3 border-brand-200">
            <SectionTitle>Edit debt</SectionTitle>
            {editDebtErr ? <Notice tone="danger">{editDebtErr}</Notice> : null}
            <Field label="Person">
              {(id) => (
                <SelectInput id={id} value={editDebtPersonId} onChange={(e) => setEditDebtPersonId(e.target.value)}>
                  {summaries.map((s) => (
                    <option key={s.person.id} value={s.person.id}>{s.person.name}</option>
                  ))}
                </SelectInput>
              )}
            </Field>
            <Field label="Original amount">
              {(id) => <MoneyInput id={id} value={editDebtAmount} onChange={setEditDebtAmount} />}
            </Field>
            <Field label="Due date (optional)">
              {(id) => <TextInput id={id} type="date" value={editDebtDue} onChange={(e) => setEditDebtDue(e.target.value)} />}
            </Field>
            <Field label="Note (optional)">
              {(id) => <TextInput id={id} value={editDebtReason} onChange={(e) => setEditDebtReason(e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" onClick={() => setEditingDebt(null)}>Cancel</Button>
              <Button loading={savingDebt} onClick={handleSaveDebtEdit}>Save debt</Button>
            </div>
          </Card>
        ) : null}
        {selected.debts.length === 0 ? (
          <Card className="p-5 text-center space-y-1">
            <p className="text-[15px] font-semibold text-ink">No borrowing or lending yet</p>
            <p className="text-xs text-ink-muted">Use the buttons above to record money lent or borrowed with {person.name}.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {selected.debts.map((d) => {
              const settled = d.total_amount_paise - d.remaining_amount_paise;
              const dSettlements = selected.settlements.filter((s) => s.debt_id === d.id);
              const isOverdue = d.remaining_amount_paise > 0 && Boolean(d.due_date && d.due_date < today);
              return (
                <Card key={d.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-bold text-ink">
                        {d.direction === "they_owe" ? "You lent" : "You borrowed"} {formatINR(d.total_amount_paise)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDay(d.created_at.slice(0, 10))}
                        {d.due_date ? ` · Due ${formatDay(d.due_date)}` : ""}
                        {d.reason ? ` · ${d.reason}` : ""}
                      </p>
                    </div>
                    <span
                      className={cx(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                        isOverdue
                          ? "bg-red-50 text-red-700"
                          : d.status === "settled"
                            ? "bg-brand-50 text-brand-700"
                            : d.status === "partially_settled"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-[#F1F3EE] text-ink-soft"
                      )}
                    >
                      {isOverdue ? "Overdue" : d.status === "partially_settled" ? "Partially settled" : d.status === "settled" ? "Settled" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-soft pt-1 border-t border-line">
                    <span>{d.direction === "they_owe" ? "Received" : "Repaid"}: {formatINR(settled)}</span>
                    <span className="font-bold text-ink">Remaining: {formatINR(d.remaining_amount_paise)}</span>
                  </div>
                  {dSettlements.length > 0 ? (
                    <div className="pt-1 space-y-1">
                      {dSettlements.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 text-[11.5px] text-ink-muted">
                          <span>
                            • {formatDay(s.settled_at.slice(0, 10))}: {formatINR(s.amount_paise)}
                            {s.notes ? ` (${s.notes})` : ""}
                          </span>
                          {confirmReverseId === s.id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <button type="button" onClick={() => handleReverseSettlement(s.id)} className="text-red-700 font-semibold">
                                Confirm reverse
                              </button>
                              <button type="button" onClick={() => setConfirmReverseId(null)} className="text-ink-soft">
                                Keep
                              </button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setConfirmReverseId(s.id)} className="text-red-700 font-medium">
                              Reverse
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <button type="button" onClick={() => openEditDebt(d)} className="font-semibold text-ink-soft hover:text-ink">
                      Edit
                    </button>
                    {confirmDeleteDebtId === d.id ? (
                      <span className="inline-flex items-center gap-2">
                        <button type="button" onClick={() => handleDeleteDebt(d.id)} className="font-semibold text-red-700">
                          Confirm delete
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteDebtId(null)} className="text-ink-soft">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmDeleteDebtId(d.id)} className="font-semibold text-red-700">
                        Delete
                      </button>
                    )}
                  </div>
                  {d.remaining_amount_paise > 0 ? (
                    <Link
                      to={`/money?settle=${d.id}`}
                      className="block text-center text-[13px] font-semibold text-brand-700 pt-1"
                    >
                      Record repayment →
                    </Link>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}

        {deleteErr ? <Notice tone="danger">{deleteErr}</Notice> : null}
        <Button
          variant="danger"
          icon={<IconTrash size={16} />}
          onClick={() => handleDeletePerson(person.id)}
        >
          Delete person
        </Button>
      </Screen>
    );
  }

  // Directory View (/people)
  return (
    <Screen
      title="People"
      subtitle="Track who owes you and whom you owe"
      right={
        <button
          type="button"
          onClick={openAdd}
          aria-label="Add person"
          className="h-9 px-3 rounded-full bg-brand-700 text-white text-[13px] font-semibold inline-flex items-center gap-1"
        >
          <IconPlus size={16} /> Add
        </button>
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {showAdd ? (
        <Card className="p-4 space-y-3">
          <SectionTitle>Add a person</SectionTitle>
          {formErr ? <Notice tone="danger">{formErr}</Notice> : null}
          <Field label="Name">
            {(id) => <TextInput id={id} value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Ahmed, Safiya" autoFocus />}
          </Field>
          <Field label="Phone (optional)">
            {(id) => <TextInput id={id} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Optional mobile number" inputMode="tel" />}
          </Field>
          <Field label="Note (optional)">
            {(id) => <TextInput id={id} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="e.g. Friend, Coworker" />}
          </Field>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSavePerson}>Save person</Button>
          </div>
        </Card>
      ) : null}

      <TextInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone or note…"
        aria-label="Search people"
      />

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <span className="w-11 h-11 rounded-full bg-brand-50 text-brand-700 mx-auto flex items-center justify-center">
            <IconUser size={22} />
          </span>
          <p className="text-[15px] font-bold text-ink">
            {summaries.length === 0 ? "No people added yet" : "No matching person"}
          </p>
          <p className="text-xs text-ink-muted">
            {summaries.length === 0
              ? "Add friends, family, or coworkers you lend to or borrow from."
              : "Try another name or clear your search."}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {filtered.map((s) => {
            const today = todayLocalISO();
            const hasOverdue = s.debts.some(
              (d) => d.remaining_amount_paise > 0 && Boolean(d.due_date && d.due_date < today)
            );
            const hasGroup = s.groupReceivablePaise > 0 || s.groupPayablePaise > 0;
            return (
              <Link
                key={s.person.id}
                to={`/people/${s.person.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02]"
              >
                <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center shrink-0">
                  {s.person.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-semibold text-ink truncate">{s.person.name}</p>
                    {hasOverdue ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold shrink-0">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cx(
                      "text-xs truncate font-medium",
                      s.netBalancePaise > 0
                        ? "text-brand-700"
                        : s.netBalancePaise < 0
                          ? "text-amber-700"
                          : "text-ink-muted"
                    )}
                  >
                    {s.statusLabel}
                    {hasGroup ? " · includes group split" : ""}
                  </p>
                </div>
                <IconChevronRight size={18} className="text-ink-faint shrink-0" />
              </Link>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
