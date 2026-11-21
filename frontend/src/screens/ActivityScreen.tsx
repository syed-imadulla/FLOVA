// Activity — every income, expense, check-in and expected payout, newest first.
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActivityRow } from "../app/ActivityRow";
import { paiseToInput } from "../app/moneyText";
import { TransactionForm, type TxSubmit } from "../app/TransactionForm";
import { useActivity } from "../app/useActivity";
import { useDataVersion } from "../data/DataVersionProvider";
import { todayLocalISO } from "../data/dates";
import { deleteTransaction, updateTransaction } from "../services/data";
import type { ActivityItem } from "../types/contracts";
import { Button, Card, Chip, EmptyState, Notice, Screen, Sheet, Skeleton, relativeDayLabel } from "../ui/kit";
import { IconActivity, IconMic, IconTrash } from "../ui/icons";

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
    <Screen title="Your money activity" subtitle="Everything you've recorded">
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
            action={
              <Button icon={<IconMic size={18} />} onClick={() => navigate("/voice")}>
                Add by voice
              </Button>
            }
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
  const type = item.type === "income" ? "income" : "expense";

  async function save(v: TxSubmit) {
    await updateTransaction(item.id, {
      type: v.type,
      amount: v.amountPaise,
      category: v.category,
      description: v.note || undefined,
      expenseType: v.expenseType ?? undefined,
      ownership: v.ownership,
      date: v.date,
    });
    onDone();
  }

  async function remove() {
    setDeleting(true);
    setErr(null);
    try {
      await deleteTransaction(item.id);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {item.payoutId ? <Notice tone="info">This income is linked to an expected payout. Changing it updates what's been received.</Notice> : null}
      <TransactionForm
        initial={{
          type,
          amount: paiseToInput(item.amountPaise ?? null),
          category: item.category || "other",
          expenseType: item.expenseType ?? "",
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
