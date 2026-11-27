import { categoryLabel } from "./categories";
import { formatINR } from "../lib/money";
import type { ActivityItem } from "../types/contracts";
import { ListRow } from "../ui/kit";
import { IconArrowDown, IconArrowUp, IconClock, IconWallet } from "../ui/icons";

const INFLOW_LABELS: Record<string, string> = {
  family_support: "Family support",
  pocket_money: "Pocket money",
  gift: "Gift",
  donation: "Donation",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

/** One activity entry, rendered identically on Home and Activity. */
export function ActivityRow({ item, onClick }: { item: ActivityItem; onClick?: () => void }) {
  if (item.kind === "checkin") {
    return (
      <ListRow
        icon={<IconWallet size={18} />}
        iconTone="info"
        title="Balance check-in"
        subtitle={item.snapshot ? `Cash ${formatINR(item.snapshot.cashPaise)} · Bank ${formatINR(item.snapshot.bankPaise)}` : "Balance recorded"}
        value={item.snapshot ? formatINR(item.snapshot.totalPersonalPaise) : undefined}
        valueTone="muted"
        onClick={onClick}
      />
    );
  }
  if (item.kind === "expected_payout") {
    return (
      <ListRow
        icon={<IconClock size={18} />}
        iconTone="warn"
        title={item.title || "Expected payout"}
        subtitle={`Expected${item.expectedDate ? " " + item.expectedDate : ""} · not counted yet`}
        value={item.amountPaise !== undefined ? formatINR(item.amountPaise) : undefined}
        valueTone="muted"
        onClick={onClick}
      />
    );
  }
  const income = item.type === "income";
  const notMine = item.ownership === "not_mine";
  const txType = item.type === "income" || item.type === "expense" ? item.type : undefined;
  const sub = [
    categoryLabel(item.category, txType),
    notMine ? "Not your money" : item.expenseType ? (item.expenseType === "work" ? "Work" : "Living") : null,
    income && item.inflowCategory && INFLOW_LABELS[item.inflowCategory] ? INFLOW_LABELS[item.inflowCategory] : null,
    item.paymentMethod && PAYMENT_LABELS[item.paymentMethod] ? PAYMENT_LABELS[item.paymentMethod] : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <ListRow
      icon={income ? <IconArrowUp size={18} /> : <IconArrowDown size={18} />}
      iconTone={notMine ? "neutral" : income ? "income" : "expense"}
      title={!item.title || item.title === item.category ? categoryLabel(item.category, txType) : item.title}
      subtitle={sub}
      value={item.amountPaise !== undefined ? `${income ? "+" : "−"}${formatINR(item.amountPaise).replace("−", "")}` : undefined}
      valueTone={notMine ? "muted" : income ? "income" : "expense"}
      onClick={onClick}
    />
  );
}
