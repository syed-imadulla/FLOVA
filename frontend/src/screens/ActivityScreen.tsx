// Activity — every income, expense, check-in and expected payout, newest first.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ActivityRow } from "../app/ActivityRow";
import { paiseToInput } from "../app/moneyText";
import { TransactionForm, type TxSubmit } from "../app/TransactionForm";
import { useActivity } from "../app/useActivity";
import { useDataVersion } from "../data/DataVersionProvider";
import { todayLocalISO } from "../data/dates";
import { deleteTransaction, updateTransaction } from "../services/data";
import { deleteReceiptObjectQuietly, getReceiptSignedUrl } from "../services/receiptStorage";
import type { ActivityItem } from "../types/contracts";
import { Button, Card, Chip, EmptyState, Notice, Screen, Sheet, Skeleton, relativeDayLabel } from "../ui/kit";
import { IconActivity, IconTrash } from "../ui/icons";

type Filter = "all" | "income" | "expense" | "checkin";

export function ActivityScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bump } = useDataVersion();
  const { items, loading, error } = useActivity({ limit: 200 });
  const [filter, setFilter] = useState<Filter>("all");
  const [flash] = useState<string | null>(() => (location.state as { flash?: string } | null)?.flash ?? null);
  const [editing, setEditing] = useState<ActivityItem | null>(null);
  const today = todayLocalISO();

  // Drop the one-time "saved" message from history so back/refresh doesn't show it again.
  useEffect(() => {
    if (flash) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const list = (items ?? []).filter((it) => {
      if (filter === "all") return true;
      if (filter === "checkin") return it.kind === "checkin";
      return (it.kind === "transaction" || it.kind === "payout_receipt") && it.type === filter;
    });
    const map = new Map<string, ActivityItem[]>();
    for (const it of list) {
      const key = it.date || it.timestamp.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items, filter]);

  function open(it: ActivityItem) {
    if (it.kind === "expected_payout") navigate("/payouts");
    else if (it.kind === "transaction" || it.kind === "payout_receipt") setEditing(it);
  }

  return (
    <Screen
      title="Your money activity"
      subtitle="Everything you've recorded"
      right={
        <Link
          to="/import"
          className="h-9 px-3 rounded-full bg-brand-50 border border-brand-100 text-brand-800 text-[12.5px] font-semibold inline-flex items-center"
        >
          Import CSV
        </Link>
      }
    >
      {flash ? <Notice tone="success">{flash}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {(
          [
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expense"],
            ["checkin", "Check-ins"],
          ] as Array<[Filter, string]>
        ).map(([v, l]) => (
          <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>
            {l}
          </Chip>
        ))}
      </div>

      {loading ? (
        <Card className="p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconActivity size={22} />}
            title={filter === "all" ? "No activity yet" : "Nothing here yet"}
          >
            Record income or an expense and it will show up here.
          </EmptyState>
        </Card>
      ) : (
        groups.map(([date, list]) => (
          <section key={date} className="space-y-2">
            <h2 className="text-[13px] font-bold text-ink-soft px-1">{relativeDayLabel(date, today)}</h2>
            <Card className="p-1 divide-y divide-line">
              {list.map((it) => (
                <ActivityRow key={`${it.kind}-${it.id}`} item={it} onClick={it.kind === "checkin" ? undefined : () => open(it)} />
              ))}
            </Card>
          </section>
        ))
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit entry">
        {editing ? (
          <EditBody
            key={editing.id}
            item={editing}
            onDone={() => {
              setEditing(null);
              bump();
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function EditBody({ item, onDone }: { item: ActivityItem; onDone: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(item.receiptPath ?? null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptErr, setReceiptErr] = useState<string | null>(null);
  const [confirmRemoveReceipt, setConfirmRemoveReceipt] = useState(false);
  const type = item.type === "income" ? "income" : "expense";

  async function save(v: TxSubmit) {
    const isMineExpense = v.type === "expense" && v.ownership === "mine";
    const isMineIncome = v.type === "income" && v.ownership === "mine";
    await updateTransaction(item.id, {
      type: v.type,
      amount: v.amountPaise,
      category: v.category,
      description: v.note ? v.note.trim() : null,
      expenseType: isMineExpense ? v.expenseType : null,
      inflowCategory: isMineIncome ? v.inflowCategory : null,
      paymentMethod: v.paymentMethod,
      receiptPath,
      ownership: v.ownership,
      date: v.date,
    });
    onDone();
  }

  async function viewReceipt() {
    if (!receiptPath) return;
    setReceiptBusy(true);
    setReceiptErr(null);
    try {
      const url = await getReceiptSignedUrl(receiptPath);
      setReceiptUrl(url);
    } catch (e) {
      setReceiptErr(e instanceof Error ? e.message : "Could not load receipt evidence.");
    } finally {
      setReceiptBusy(false);
    }
  }

  async function removeReceipt() {
    if (!receiptPath) return;
    setReceiptBusy(true);
    setReceiptErr(null);
    try {
      await updateTransaction(item.id, {
        type,
        amount: item.amountPaise ?? 0,
        category: item.category || "other",
        receiptPath: null,
      });
      await deleteReceiptObjectQuietly(receiptPath);
      setReceiptPath(null);
      setReceiptUrl(null);
      setConfirmRemoveReceipt(false);
    } catch (e) {
      setReceiptErr(e instanceof Error ? e.message : "Could not remove receipt evidence.");
    } finally {
      setReceiptBusy(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setErr(null);
    try {
      const oldPath = receiptPath;
      await deleteTransaction(item.id);
      if (oldPath) await deleteReceiptObjectQuietly(oldPath);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {item.payoutId ? <Notice tone="info">This income is linked to an expected payout. Changing it updates what's been received.</Notice> : null}
      {receiptPath ? (
        <Card tone="soft" className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-ink">Receipt evidence</p>
              <p className="text-[11px] text-ink-muted">Stored privately · short-lived access</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" className="h-8 w-auto px-3 text-xs" loading={receiptBusy} onClick={viewReceipt}>
                View
              </Button>
              <button
                type="button"
                onClick={() => setConfirmRemoveReceipt((v) => !v)}
                className="text-xs font-semibold text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
          {receiptErr ? <Notice tone="danger">{receiptErr}</Notice> : null}
          {receiptUrl ? (
            receiptPath.toLowerCase().endsWith(".pdf") ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-brand-700 underline"
              >
                Open PDF receipt (expires in 2 min)
              </a>
            ) : (
              <div className="space-y-1.5">
                <img src={receiptUrl} alt="Saved receipt" className="w-full max-h-60 object-contain rounded-xl border border-line bg-white" />
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] font-semibold text-brand-700 underline"
                >
                  Open full size
                </a>
              </div>
            )
          ) : null}
          {confirmRemoveReceipt ? (
            <div className="p-2 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
              <p className="text-xs text-ink">Remove this receipt image from private storage?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="h-8 text-xs" onClick={() => setConfirmRemoveReceipt(false)} disabled={receiptBusy}>
                  Keep receipt
                </Button>
                <Button variant="danger" className="h-8 text-xs" loading={receiptBusy} onClick={removeReceipt}>
                  Confirm remove
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
      <TransactionForm
        initial={{
          type,
          amount: paiseToInput(item.amountPaise ?? null),
          category: item.category || "other",
          expenseType: item.expenseType ?? "",
          inflowCategory: item.inflowCategory ?? "",
          paymentMethod: item.paymentMethod ?? "",
          ownership: item.ownership ?? "mine",
          date: item.date,
          note: item.title && item.title !== item.category ? item.title : "",
        }}
        lockType={!!item.payoutId}
        submitLabel="Save changes"
        onSubmit={save}
      />
      {err ? <Notice tone="danger">{err}</Notice> : null}
      {confirmDelete ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} loading={deleting}>
            Delete for good
          </Button>
        </div>
      ) : (
        <Button variant="danger" icon={<IconTrash size={18} />} onClick={() => setConfirmDelete(true)}>
          Delete entry
        </Button>
      )}
    </div>
  );
}
