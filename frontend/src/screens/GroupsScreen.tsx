// Groups — Shared group expenses, equal/custom/percentage splits, and settlements.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useDataVersion } from "../data/DataVersionProvider";
import { categoryLabel, EXPENSE_CATEGORIES } from "../app/categories";
import { splitCustom, splitEqual, splitPercentage } from "../engine/groupSplitEngine";
import { formatINR, toPaiseStrict } from "../lib/money";
import {
  computeGroupBalances,
  createExpenseGroup,
  deleteExpenseGroup,
  deleteGroupExpense,
  listExpenseGroups,
  listGroupExpenses,
  listGroupMembers,
  listGroupSettlements,
  listGroupSplits,
  recordGroupExpense,
  recordGroupSettlement,
  reverseGroupSettlement,
  updateGroupExpense,
} from "../services/groupExpenses";
import { listPeople } from "../services/peerDebts";
import type {
  ExpenseGroup,
  ExpenseGroupMember,
  ExpenseType,
  GroupExpense,
  GroupExpenseSplit,
  GroupSettlement,
  GroupSplitType,
  Person,
} from "../types/contracts";
import { Button, Card, Chip, Field, MoneyInput, Notice, Screen, SectionTitle, Segmented, SelectInput, Skeleton, TextInput, cx, formatDay } from "../ui/kit";
import { IconCheckCircle, IconChevronRight, IconPlus, IconTrash } from "../ui/icons";

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

export function GroupsScreen() {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const { version, bump } = useDataVersion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [members, setMembers] = useState<ExpenseGroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [splits, setSplits] = useState<GroupExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<GroupSettlement[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // Create group state
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Add / Edit shared expense state
  const [showAddExp, setShowAddExp] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(todayLocalISO());
  const [expPayer, setExpPayer] = useState<string>("__self__");
  const [expCategory, setExpCategory] = useState<string>("food");
  const [expType, setExpType] = useState<ExpenseType>("living");
  const [splitType, setSplitType] = useState<GroupSplitType>("equal");
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [pctInputs, setPctInputs] = useState<Record<string, string>>({});
  const [expPreview, setExpPreview] = useState(false);
  const [expErr, setExpErr] = useState<string | null>(null);
  const [savingExp, setSavingExp] = useState(false);

  // Delete expense / reverse settlement state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [expDeleteErr, setExpDeleteErr] = useState<string | null>(null);
  const [deletingExp, setDeletingExp] = useState(false);
  const [reversingSettlementId, setReversingSettlementId] = useState<string | null>(null);
  const [reverseErr, setReverseErr] = useState<string | null>(null);
  const [reversingSettle, setReversingSettle] = useState(false);

  // Settlement state
  const [settlingSplit, setSettlingSplit] = useState<(GroupExpenseSplit & { memberName: string }) | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settleErr, setSettleErr] = useState<string | null>(null);
  const [savingSettle, setSavingSettle] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, m, e, sp, st, p] = await Promise.all([
        listExpenseGroups(),
        listGroupMembers(),
        listGroupExpenses(),
        listGroupSplits(),
        listGroupSettlements(),
        listPeople(),
      ]);
      setGroups(g);
      setMembers(m);
      setExpenses(e);
      setSplits(sp);
      setSettlements(st);
      setPeople(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  async function handleCreateGroup() {
    setCreateErr(null);
    if (!groupName.trim()) {
      setCreateErr("Enter a group name.");
      return;
    }
    if (selectedMemberIds.length === 0) {
      setCreateErr("Select at least one person to add to the group.");
      return;
    }
    setCreating(true);
    try {
      const created = await createExpenseGroup({
        name: groupName,
        description: groupDesc || null,
        memberPersonIds: selectedMemberIds,
      });
      setShowCreate(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedMemberIds([]);
      bump();
      navigate(`/groups/${created.id}`);
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : "Could not create group.");
    } finally {
      setCreating(false);
    }
  }

  // Detail View (/groups/:groupId)
  if (groupId) {
    const group = groups.find((g) => g.id === groupId);
    const grpMembers = members.filter((m) => m.group_id === groupId);
    const grpExpenses = expenses.filter((e) => e.group_id === groupId);
    const grpExpIds = new Set(grpExpenses.map((e) => e.id));
    const grpSplits = splits.filter((s) => grpExpIds.has(s.group_expense_id));

    if (loading) {
      return (
        <Screen title="Group details" back="/groups">
          <Skeleton className="h-32" />
          <Skeleton className="h-44" />
        </Screen>
      );
    }
    if (!group) {
      return (
        <Screen title="Group not found" back="/groups">
          <Notice tone="warn">This group could not be found.</Notice>
        </Screen>
      );
    }

    const balances = computeGroupBalances(grpMembers, grpExpenses, grpSplits, people);
    const totalGroupSpend = grpExpenses.reduce((acc, e) => acc + e.total_amount_paise, 0);

    function computeCurrentShares() {
      const totalPaise = parseRupees(expAmount);
      if (!totalPaise) throw new Error("Enter a valid total amount.");
      const participants = grpMembers.map((m) => ({
        isSelf: m.is_self,
        personId: m.person_id,
      }));
      if (splitType === "equal") return splitEqual(totalPaise, participants);
      if (splitType === "custom") {
        return splitCustom(
          totalPaise,
          participants.map((p) => {
            const key = p.isSelf ? "__self__" : p.personId!;
            const raw = customInputs[key] || "0";
            const cleaned = raw.replace(/,/g, "").trim();
            const sharePaise = cleaned === "" || cleaned === "0" ? 0 : toPaiseStrict(cleaned);
            return { ...p, shareAmountPaise: sharePaise };
          })
        );
      }
      return splitPercentage(
        totalPaise,
        participants.map((p) => {
          const key = p.isSelf ? "__self__" : p.personId!;
          return { ...p, percent: Number(pctInputs[key] || "0") };
        })
      );
    }

    function resetExpenseForm() {
      setShowAddExp(false);
      setEditingExpenseId(null);
      setExpPreview(false);
      setExpErr(null);
      setExpDesc("");
      setExpAmount("");
      setExpDate(todayLocalISO());
      setExpPayer("__self__");
      setExpCategory("food");
      setExpType("living");
      setSplitType("equal");
      setCustomInputs({});
      setPctInputs({});
    }

    function startEditExpense(exp: GroupExpense, expSplits: GroupExpenseSplit[]) {
      setEditingExpenseId(exp.id);
      setExpDesc(exp.description);
      setExpAmount((exp.total_amount_paise / 100).toString());
      setExpDate(exp.expense_date);
      setExpPayer(exp.paid_by_self ? "__self__" : exp.paid_by_person_id ?? "__self__");
      setExpCategory(exp.category || "food");
      setExpType(exp.expense_type || "living");
      setSplitType(exp.split_type);

      const nextCustom: Record<string, string> = {};
      const nextPct: Record<string, string> = {};
      for (const sp of expSplits) {
        const key = sp.is_self ? "__self__" : sp.person_id ?? "";
        if (!key) continue;
        nextCustom[key] = (sp.share_amount_paise / 100).toString();
        const pct = exp.total_amount_paise > 0
          ? Math.round((sp.share_amount_paise / exp.total_amount_paise) * 10000) / 100
          : 0;
        nextPct[key] = pct.toString();
      }
      setCustomInputs(nextCustom);
      setPctInputs(nextPct);
      setExpPreview(false);
      setExpErr(null);
      setShowAddExp(true);
    }

    async function handleSaveExpense() {
      setExpErr(null);
      try {
        const totalPaise = parseRupees(expAmount);
        if (!totalPaise) throw new Error("Enter a valid total amount.");
        const shares = computeCurrentShares();
        setSavingExp(true);
        if (editingExpenseId) {
          await updateGroupExpense(editingExpenseId, {
            description: expDesc,
            totalAmountPaise: totalPaise,
            paidBySelf: expPayer === "__self__",
            paidByPersonId: expPayer === "__self__" ? null : expPayer,
            expenseDate: expDate,
            splitType,
            shares,
            category: expCategory,
            expenseType: expType,
          });
        } else {
          await recordGroupExpense({
            groupId: group!.id,
            description: expDesc,
            totalAmountPaise: totalPaise,
            paidBySelf: expPayer === "__self__",
            paidByPersonId: expPayer === "__self__" ? null : expPayer,
            expenseDate: expDate,
            splitType,
            shares,
            category: expCategory,
            expenseType: expType,
          });
        }
        resetExpenseForm();
        bump();
      } catch (err) {
        setExpErr(err instanceof Error ? err.message : "Could not save group expense.");
      } finally {
        setSavingExp(false);
      }
    }

    async function handleDeleteGroupExpense(expenseId: string) {
      setExpDeleteErr(null);
      setDeletingExp(true);
      try {
        await deleteGroupExpense(expenseId);
        setDeletingExpenseId(null);
        bump();
      } catch (err) {
        setExpDeleteErr(err instanceof Error ? err.message : "Could not delete group expense.");
      } finally {
        setDeletingExp(false);
      }
    }

    async function handleReverseSettlement(settlementId: string) {
      setReverseErr(null);
      setReversingSettle(true);
      try {
        await reverseGroupSettlement(settlementId);
        setReversingSettlementId(null);
        bump();
      } catch (err) {
        setReverseErr(err instanceof Error ? err.message : "Could not reverse settlement.");
      } finally {
        setReversingSettle(false);
      }
    }

    async function handleSettleSplit() {
      if (!settlingSplit) return;
      setSettleErr(null);
      const paise = parseRupees(settleAmount);
      if (!paise) {
        setSettleErr("Enter a valid settlement amount.");
        return;
      }
      setSavingSettle(true);
      try {
        await recordGroupSettlement(settlingSplit, {
          direction: settlingSplit.direction === "you_owe" ? "repayment_out" : "repayment_in",
          amountPaise: paise,
          notes: settleNote || null,
        });
        setSettlingSplit(null);
        bump();
      } catch (err) {
        setSettleErr(err instanceof Error ? err.message : "Could not record settlement.");
      } finally {
        setSavingSettle(false);
      }
    }

    async function handleDeleteGroup() {
      setDeleteErr(null);
      try {
        await deleteExpenseGroup(group!.id);
        bump();
        navigate("/groups", { replace: true });
      } catch (err) {
        setDeleteErr(err instanceof Error ? err.message : "Could not delete group.");
      }
    }

    let previewShares: ReturnType<typeof splitEqual> = [];
    if (expPreview) {
      try {
        previewShares = computeCurrentShares();
      } catch {
        previewShares = [];
      }
    }

    return (
      <Screen
        title={group.name}
        subtitle={`${grpMembers.length} members · Total ${formatINR(totalGroupSpend)}`}
        back="/groups"
        right={
          <button
            type="button"
            onClick={() => {
              resetExpenseForm();
              setShowAddExp(true);
            }}
            className="h-9 px-3 rounded-full bg-brand-700 text-white text-[13px] font-semibold inline-flex items-center gap-1"
          >
            <IconPlus size={16} /> Expense
          </button>
        }
      >
        {/* Add / Edit Shared Expense & Split Config */}
        {showAddExp ? (
          <Card className="p-4 space-y-3">
            <SectionTitle>
              {expPreview
                ? editingExpenseId
                  ? "Confirm expense update"
                  : "Confirm shared expense"
                : editingExpenseId
                  ? "Edit shared expense"
                  : "Add shared expense"}
            </SectionTitle>
            {expErr ? <Notice tone="danger">{expErr}</Notice> : null}

            {expPreview ? (
              <div className="space-y-3">
                <Card tone="soft" className="p-3.5 space-y-1.5">
                  <p className="text-[15px] font-bold text-ink">{expDesc}</p>
                  <p className="text-xs text-ink-soft">
                    {expPayer === "__self__" ? "You paid" : `${peopleById.get(expPayer) ?? "Member"} paid`}{" "}
                    {formatINR(parseRupees(expAmount) ?? 0)} ({splitType} split · {categoryLabel(expCategory, "expense")} · {expType === "work" ? "Work" : "Living"})
                  </p>
                  <div className="pt-1 border-t border-line space-y-1">
                    {previewShares.map((s) => (
                      <div key={s.isSelf ? "self" : s.personId} className="flex justify-between text-xs">
                        <span>{s.isSelf ? "Your share" : peopleById.get(s.personId!) ?? "Member"}</span>
                        <span className="font-semibold tabular-nums">{formatINR(s.shareAmountPaise)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setExpPreview(false)}>Edit</Button>
                  <Button loading={savingExp} icon={<IconCheckCircle size={18} />} onClick={handleSaveExpense}>
                    {editingExpenseId ? "Save changes" : "Confirm & save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Description">
                  {(id) => <TextInput id={id} value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="e.g. Restaurant dinner" />}
                </Field>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Total bill">
                    {(id) => <MoneyInput id={id} value={expAmount} onChange={setExpAmount} />}
                  </Field>
                  <Field label="Date">
                    {(id) => <TextInput id={id} type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />}
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Category">
                    {(id) => (
                      <SelectInput
                        id={id}
                        value={expCategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExpCategory(val);
                          const opt = EXPENSE_CATEGORIES.find((c) => c.value === val);
                          if (opt?.suggests) setExpType(opt.suggests);
                        }}
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </SelectInput>
                    )}
                  </Field>
                  <Field label="Classification">
                    {() => (
                      <Segmented
                        value={expType}
                        onChange={setExpType}
                        options={[
                          { value: "living", label: "Living" },
                          { value: "work", label: "Work" },
                        ]}
                      />
                    )}
                  </Field>
                </div>
                <Field label="Who paid?">
                  {(id) => (
                    <SelectInput id={id} value={expPayer} onChange={(e) => setExpPayer(e.target.value)}>
                      <option value="__self__">You</option>
                      {grpMembers
                        .filter((m) => !m.is_self && m.person_id)
                        .map((m) => (
                          <option key={m.person_id!} value={m.person_id!}>
                            {peopleById.get(m.person_id!) ?? "Member"}
                          </option>
                        ))}
                    </SelectInput>
                  )}
                </Field>
                <Segmented
                  value={splitType}
                  onChange={setSplitType}
                  options={[
                    { value: "equal", label: "Equal" },
                    { value: "custom", label: "Custom" },
                    { value: "percentage", label: "Percent %" },
                  ]}
                />

                {splitType === "custom" ? (
                  <div className="space-y-2">
                    {grpMembers.map((m) => {
                      const key = m.is_self ? "__self__" : m.person_id!;
                      const label = m.is_self ? "Your share (₹)" : `${peopleById.get(m.person_id!) ?? "Member"} (₹)`;
                      return (
                        <Field key={key} label={label}>
                          {(id) => (
                            <MoneyInput
                              id={id}
                              value={customInputs[key] || ""}
                              onChange={(v) => setCustomInputs((prev) => ({ ...prev, [key]: v }))}
                            />
                          )}
                        </Field>
                      );
                    })}
                  </div>
                ) : null}

                {splitType === "percentage" ? (
                  <div className="space-y-2">
                    {grpMembers.map((m) => {
                      const key = m.is_self ? "__self__" : m.person_id!;
                      const label = m.is_self ? "Your share (%)" : `${peopleById.get(m.person_id!) ?? "Member"} (%)`;
                      return (
                        <Field key={key} label={label}>
                          {(id) => (
                            <TextInput
                              id={id}
                              inputMode="decimal"
                              placeholder="0"
                              value={pctInputs[key] || ""}
                              onChange={(e) => setPctInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                            />
                          )}
                        </Field>
                      );
                    })}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="secondary" onClick={resetExpenseForm}>Cancel</Button>
                  <Button
                    onClick={() => {
                      setExpErr(null);
                      try {
                        if (!expDesc.trim()) throw new Error("Enter a description.");
                        computeCurrentShares();
                        setExpPreview(true);
                      } catch (err) {
                        setExpErr(err instanceof Error ? err.message : "Check split amounts.");
                      }
                    }}
                  >
                    Review split
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : null}

        {/* Settlement Panel */}
        {settlingSplit ? (
          <Card className="p-4 space-y-3 border-brand-200">
            <SectionTitle>
              {settlingSplit.direction === "they_owe"
                ? `Receive from ${settlingSplit.memberName}`
                : `Pay ${settlingSplit.memberName}`}
            </SectionTitle>
            <p className="text-xs text-ink-soft">
              Remaining: <strong className="text-ink">{formatINR(settlingSplit.remaining_amount_paise)}</strong>
            </p>
            {settleErr ? <Notice tone="danger">{settleErr}</Notice> : null}
            <Chip
              active={parseRupees(settleAmount) === settlingSplit.remaining_amount_paise}
              onClick={() => setSettleAmount((settlingSplit.remaining_amount_paise / 100).toString())}
            >
              Full ({formatINR(settlingSplit.remaining_amount_paise)})
            </Chip>
            <Field label="Amount">
              {(id) => <MoneyInput id={id} value={settleAmount} onChange={setSettleAmount} large />}
            </Field>
            <Field label="Note (optional)">
              {(id) => <TextInput id={id} value={settleNote} onChange={(e) => setSettleNote(e.target.value)} placeholder="e.g. UPI" />}
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setSettlingSplit(null)}>Cancel</Button>
              <Button loading={savingSettle} onClick={handleSettleSplit}>Confirm settlement</Button>
            </div>
          </Card>
        ) : null}

        {/* Group Member Balances */}
        <SectionTitle>Member balances</SectionTitle>
        <Card className="divide-y divide-line">
          {balances.map((b) => (
            <div key={b.isSelf ? "self" : b.personId} className="px-4 py-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-ink-muted">
                  Paid {formatINR(b.totalPaidPaise)} · Share {formatINR(b.totalSharePaise)}
                </p>
              </div>
              {!b.isSelf ? (
                <span
                  className={cx(
                    "text-xs font-bold",
                    b.netBalanceWithYouPaise > 0
                      ? "text-brand-700"
                      : b.netBalanceWithYouPaise < 0
                        ? "text-amber-700"
                        : "text-ink-muted"
                  )}
                >
                  {b.netBalanceWithYouPaise > 0
                    ? `Owes you ${formatINR(b.netBalanceWithYouPaise)}`
                    : b.netBalanceWithYouPaise < 0
                      ? `You owe ${formatINR(Math.abs(b.netBalanceWithYouPaise))}`
                      : "Settled"}
                </span>
              ) : (
                <span className="text-xs text-ink-muted">Your account</span>
              )}
            </div>
          ))}
        </Card>

        {/* Expense History & Settlements */}
        <SectionTitle>Expense history ({grpExpenses.length})</SectionTitle>
        {grpExpenses.length === 0 ? (
          <Card className="p-5 text-center space-y-1">
            <p className="text-[14px] font-semibold text-ink">No shared expenses yet</p>
            <p className="text-xs text-ink-muted">Tap + Expense above to split a bill with this group.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {grpExpenses.map((e) => {
              const eSplits = grpSplits.filter((s) => s.group_expense_id === e.id);
              const payerName = e.paid_by_self ? "You" : peopleById.get(e.paid_by_person_id ?? "") ?? "Member";
              const catText = `${categoryLabel(e.category ?? "food", "expense")} (${e.expense_type === "work" ? "Work" : "Living"})`;
              const isConfirmingDelete = deletingExpenseId === e.id;
              return (
                <Card key={e.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-ink">{e.description}</p>
                      <p className="text-xs text-ink-muted">
                        {payerName} paid {formatINR(e.total_amount_paise)} · {catText} · {formatDay(e.expense_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditExpense(e, eSplits)}
                        className="text-xs font-semibold text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingExpenseId(isConfirmingDelete ? null : e.id);
                          setExpDeleteErr(null);
                        }}
                        className="text-xs font-semibold text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {isConfirmingDelete ? (
                    <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
                      <p className="text-xs text-ink">
                        Delete <strong>{e.description}</strong>? This removes its splits and any linked personal expense.
                      </p>
                      {expDeleteErr ? <Notice tone="danger">{expDeleteErr}</Notice> : null}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" className="h-8 text-xs" onClick={() => setDeletingExpenseId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          className="h-8 text-xs"
                          loading={deletingExp}
                          onClick={() => handleDeleteGroupExpense(e.id)}
                        >
                          Confirm delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="divide-y divide-line border-t border-line pt-1">
                    {eSplits.map((sp) => {
                      const mName = sp.is_self
                        ? "Your share"
                        : peopleById.get(sp.person_id ?? "") ?? "Member";
                      const canSettle =
                        (sp.direction === "they_owe" || sp.direction === "you_owe") &&
                        sp.remaining_amount_paise > 0;
                      const spSettlements = settlements.filter((st) => st.group_expense_split_id === sp.id);
                      return (
                        <div key={sp.id} className="py-2 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-ink">
                                {mName}: {formatINR(sp.share_amount_paise)}
                              </p>
                              <p className="text-ink-muted">
                                {sp.direction === "self_share"
                                  ? "Your share"
                                  : sp.direction === "third_party"
                                    ? "Between other members"
                                    : sp.status === "settled"
                                      ? "Settled"
                                      : sp.direction === "they_owe"
                                        ? `Owes you ${formatINR(sp.remaining_amount_paise)}`
                                        : `You owe ${formatINR(sp.remaining_amount_paise)}`}
                              </p>
                            </div>
                            {canSettle ? (
                              <Button
                                variant="secondary"
                                className="h-8 w-auto px-3 text-xs"
                                onClick={() => {
                                  const targetName =
                                    sp.direction === "you_owe" ? payerName : mName;
                                  setSettlingSplit({ ...sp, memberName: targetName });
                                  setSettleAmount("");
                                  setSettleNote("");
                                  setSettleErr(null);
                                }}
                              >
                                Settle
                              </Button>
                            ) : null}
                          </div>
                          {spSettlements.length > 0 ? (
                            <div className="pl-2 border-l-2 border-line space-y-1">
                              {spSettlements.map((st) => (
                                <div key={st.id} className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
                                  <span>
                                    Settled {formatINR(st.amount_paise)} · {formatDay(st.settled_at.slice(0, 10))}
                                    {st.notes ? ` · ${st.notes}` : ""}
                                  </span>
                                  {reversingSettlementId === st.id ? (
                                    <span className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={reversingSettle}
                                        onClick={() => handleReverseSettlement(st.id)}
                                        className="font-semibold text-red-600 hover:underline"
                                      >
                                        Confirm
                                      </button>
                                      <span>/</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReversingSettlementId(null);
                                          setReverseErr(null);
                                        }}
                                        className="text-ink-soft hover:underline"
                                      >
                                        Cancel
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReversingSettlementId(st.id);
                                        setReverseErr(null);
                                      }}
                                      className="font-semibold text-amber-700 hover:underline"
                                    >
                                      Reverse
                                    </button>
                                  )}
                                </div>
                              ))}
                              {reverseErr && spSettlements.some((st) => st.id === reversingSettlementId) ? (
                                <Notice tone="danger">{reverseErr}</Notice>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {deleteErr ? <Notice tone="danger">{deleteErr}</Notice> : null}
        <Button variant="danger" icon={<IconTrash size={16} />} onClick={handleDeleteGroup}>
          Delete group
        </Button>
      </Screen>
    );
  }

  // Group List View (/groups)
  return (
    <Screen
      title="Groups"
      subtitle="Split bills and settle shared expenses"
      back="/money"
      right={
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setCreateErr(null);
          }}
          className="h-9 px-3 rounded-full bg-brand-700 text-white text-[13px] font-semibold inline-flex items-center gap-1"
        >
          <IconPlus size={16} /> New
        </button>
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {showCreate ? (
        <Card className="p-4 space-y-3">
          <SectionTitle>Create group</SectionTitle>
          {createErr ? <Notice tone="danger">{createErr}</Notice> : null}
          <Field label="Group name">
            {(id) => <TextInput id={id} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Goa Trip, Flatmates" />}
          </Field>
          <Field label="Description (optional)">
            {(id) => <TextInput id={id} value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} placeholder="Optional note" />}
          </Field>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold text-ink-soft">Select participants</p>
            {people.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No people added yet. <Link to="/people" className="text-brand-700 font-semibold">Add people first →</Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const active = selectedMemberIds.includes(p.id);
                  return (
                    <Chip
                      key={p.id}
                      active={active}
                      onClick={() =>
                        setSelectedMemberIds((prev) =>
                          active ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        )
                      }
                    >
                      {p.name}
                    </Chip>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={creating} onClick={handleCreateGroup}>Create group</Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <p className="text-[15px] font-bold text-ink">No groups yet</p>
          <p className="text-xs text-ink-muted">Create a group to split bills equally, by custom amounts, or by percentage.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {groups.map((g) => {
            const mCount = members.filter((m) => m.group_id === g.id).length;
            const gSpend = expenses
              .filter((e) => e.group_id === g.id)
              .reduce((acc, e) => acc + e.total_amount_paise, 0);
            return (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-black/[0.02]"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink truncate">{g.name}</p>
                  <p className="text-xs text-ink-muted">
                    {mCount} member{mCount === 1 ? "" : "s"} · Total {formatINR(gSpend)}
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
