// FLOVA app UI kit: the small set of primitives every screen is built from,
// so spacing, type and states stay identical from screen to screen.
import React, { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { IconBack, IconClose, IconInfo, IconAlert, IconCheckCircle } from "./icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ---------- Screen & header ----------
interface ScreenProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Show a back arrow. `true` goes back in history (falls back to /app); a string navigates there. */
  back?: boolean | string;
  right?: React.ReactNode;
  children: React.ReactNode;
  /** Custom header replacing the default title bar (e.g. the Home greeting). */
  header?: React.ReactNode;
}

export function Screen({ title, subtitle, back, right, children, header }: ScreenProps) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === "string") navigate(back);
    else if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate("/app");
  };
  return (
    <div className="min-h-full">
      {header ?? (
        <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
          <div className="h-14 px-4 flex items-center gap-2">
            {back ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="-ml-2 w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-black/5 active:bg-black/10"
              >
                <IconBack />
              </button>
            ) : null}
            <div className="min-w-0 flex-1">
              <h1 className="text-[19px] leading-6 font-bold text-ink truncate">{title}</h1>
              {subtitle ? <p className="text-xs text-ink-muted truncate">{subtitle}</p> : null}
            </div>
            {right}
          </div>
        </header>
      )}
      <div className="px-4 pb-6 pt-1 space-y-4">{children}</div>
    </div>
  );
}

// ---------- Surfaces ----------
export function Card({
  children,
  className,
  tone = "white",
  as: As = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { tone?: "white" | "brand" | "danger" | "warn" | "soft"; as?: any }) {
  const tones: Record<string, string> = {
    white: "bg-white border border-line",
    brand: "bg-brand-50 border border-brand-100",
    danger: "bg-red-50 border border-red-100",
    warn: "bg-amber-50 border border-amber-100",
    soft: "bg-[#F1F3EE] border border-line",
  };
  return (
    <As className={cx("rounded-2xl shadow-card", tones[tone], className)} {...rest}>
      {children}
    </As>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

// ---------- Buttons ----------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  variant = "primary",
  loading,
  className,
  children,
  icon,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; icon?: React.ReactNode }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-700/50",
    secondary: "bg-white text-ink border border-line hover:bg-[#F3F4F1] active:bg-[#ECEEE9] disabled:text-ink-faint",
    ghost: "bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100 disabled:text-ink-faint",
    danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:text-red-300",
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        "h-12 w-full rounded-xl px-4 text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-colors select-none",
        variants[variant],
        className
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx("inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin", className)}
      aria-hidden="true"
    />
  );
}

// ---------- Form fields ----------
interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: (id: string) => React.ReactNode;
}
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs font-medium text-red-700">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full h-12 rounded-xl border bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

export function TextInput({ invalid, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cx(inputBase, invalid ? "border-red-300" : "border-line", className)} {...rest} />;
}

export function SelectInput({ invalid, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={cx(inputBase, "appearance-none pr-9 bg-[length:16px] bg-no-repeat bg-[right_12px_center]", invalid ? "border-red-300" : "border-line", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Rupee amount input: numeric keypad, ₹ prefix, keeps the raw text (parsed by parseRupees). */
export function MoneyInput({
  value,
  onChange,
  invalid,
  large,
  id,
  placeholder = "0",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  large?: boolean;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center rounded-xl border bg-white px-3.5 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100",
        invalid ? "border-red-300" : "border-line",
        large ? "h-16" : "h-12"
      )}
    >
      <span className={cx("font-semibold text-ink-muted mr-1", large ? "text-2xl" : "text-[15px]")}>₹</span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        className={cx("flex-1 min-w-0 bg-transparent outline-none text-ink placeholder:text-ink-faint tabular-nums", large ? "text-3xl font-bold" : "text-[15px]")}
      />
    </div>
  );
}

// ---------- Segmented control ----------
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: React.ReactNode }>;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className="flex p-1 rounded-full bg-[#ECEFE9]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex-1 rounded-full font-semibold transition-colors",
              size === "sm" ? "h-8 text-[13px]" : "h-10 text-sm",
              active ? "bg-brand-700 text-white shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "h-8 px-3.5 rounded-full text-[13px] font-semibold border whitespace-nowrap transition-colors",
        active ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-line text-ink-soft hover:border-brand-200"
      )}
    >
      {children}
    </button>
  );
}

// ---------- Feedback ----------
export function Notice({ tone = "info", title, children, action }: { tone?: "info" | "warn" | "danger" | "success"; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode }) {
  const map = {
    info: { box: "bg-sky-50 border-sky-100 text-sky-950", icon: <IconInfo size={18} className="text-sky-700" /> },
    warn: { box: "bg-amber-50 border-amber-100 text-amber-950", icon: <IconAlert size={18} className="text-amber-700" /> },
    danger: { box: "bg-red-50 border-red-100 text-red-950", icon: <IconAlert size={18} className="text-red-600" /> },
    success: { box: "bg-brand-50 border-brand-100 text-brand-900", icon: <IconCheckCircle size={18} className="text-brand-700" /> },
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-2xl border p-3.5 flex gap-3", map.box)}>
      <div className="pt-0.5 shrink-0">{map.icon}</div>
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "opacity-90" : undefined}>{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("rounded-xl bg-[linear-gradient(90deg,#ECEEE9_0%,#F5F6F3_50%,#ECEEE9_100%)] bg-[length:200%_100%] animate-shimmer", className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-6">
      {icon ? <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">{icon}</div> : null}
      <p className="font-semibold text-ink">{title}</p>
      {children ? <p className="mt-1 text-sm text-ink-muted">{children}</p> : null}
      {action ? <div className="mt-4 max-w-[240px] mx-auto">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ ratio, tone = "brand" }: { ratio: number; tone?: "brand" | "danger" | "warn" }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const color = tone === "danger" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : "bg-brand-600";
  return (
    <div className="h-2 w-full rounded-full bg-black/[0.07] overflow-hidden">
      <div className={cx("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------- Bottom sheet ----------
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[480px] max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] animate-fadeUp">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-black/10" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5">
            <IconClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { Sheet as Modal };

// ---------- List row ----------
export function ListRow({
  icon,
  iconTone = "neutral",
  title,
  subtitle,
  value,
  valueTone = "neutral",
  onClick,
  trailing,
}: {
  icon?: React.ReactNode;
  iconTone?: "neutral" | "income" | "expense" | "brand" | "info" | "warn";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  valueTone?: "neutral" | "income" | "expense" | "muted";
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const iconTones = {
    neutral: "bg-[#F1F3EE] text-ink-soft",
    income: "bg-brand-50 text-brand-700",
    expense: "bg-red-50 text-red-600",
    brand: "bg-brand-50 text-brand-700",
    info: "bg-sky-50 text-sky-700",
    warn: "bg-amber-50 text-amber-700",
  }[iconTone];
  const valueTones = { neutral: "text-ink", income: "text-brand-700", expense: "text-red-600", muted: "text-ink-muted" }[valueTone];
  const Inner = (
    <>
      {icon ? <div className={cx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconTones)}>{icon}</div> : null}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[15px] font-semibold text-ink truncate">{title}</p>
        {subtitle ? <p className="text-xs text-ink-muted truncate">{subtitle}</p> : null}
      </div>
      {value !== undefined ? <div className={cx("text-[15px] font-bold tabular-nums whitespace-nowrap", valueTones)}>{value}</div> : null}
      {trailing}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/[0.03] active:bg-black/[0.05]">
      {Inner}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-3 py-3">{Inner}</div>
  );
}

// ---------- Formatting helpers ----------
const DAY_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const WEEKDAY_FMT = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function formatDay(iso: string): string {
  return DAY_FMT.format(parseISODate(iso));
}
export function formatWeekday(iso: string): string {
  return WEEKDAY_FMT.format(parseISODate(iso));
}
/** Whole days from today (local) to the ISO date; 0 = today. */
export function daysFromToday(iso: string, today: string): number {
  return Math.round((parseISODate(iso).getTime() - parseISODate(today).getTime()) / 86_400_000);
}
export function relativeDayLabel(iso: string, today: string): string {
  const diff = daysFromToday(iso, today);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return formatDay(iso);
}

// ---------- Splash (auth/profile gate) ----------
export function Splash() {
  return (
    <div className="flova-app min-h-dvh bg-canvas flex flex-col items-center justify-center gap-4" role="status" aria-label="Loading">
      <img src="/favicon.svg" alt="FLOVA" className="w-16 h-16 rounded-2xl object-contain shadow-fab" />
      <Spinner className="text-brand-700" />
    </div>
  );
}
