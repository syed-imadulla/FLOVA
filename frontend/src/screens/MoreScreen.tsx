// More — every secondary screen, reachable in one tap from the bottom navbar.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useProfile } from "../profile/useProfile";
import { signOut } from "../services/auth";
import { Card, Notice, Screen } from "../ui/kit";
import { IconCalendar, IconCamera, IconChevronRight, IconClock, IconLogout, IconPencil, IconShield, IconTarget, IconUser, IconWallet } from "../ui/icons";

const GROUPS: Array<{ title: string; items: Array<{ to: string; icon: React.ReactNode; label: string; hint: string }> }> = [
  {
    title: "Plan",
    items: [
      { to: "/wish", icon: <IconTarget size={20} />, label: "WISH savings goal", hint: "Save for what matters" },
      { to: "/commitments", icon: <IconCalendar size={20} />, label: "Bills & debts", hint: "Rent, EMI, fees" },
      { to: "/payouts", icon: <IconClock size={20} />, label: "Expected payments", hint: "Money you're owed" },
    ],
  },
  {
    title: "Record",
    items: [
      { to: "/checkin", icon: <IconWallet size={20} />, label: "Balance check-in", hint: "Count cash and bank" },
      { to: "/add", icon: <IconPencil size={20} />, label: "Add income or expense", hint: "Manual entry" },
      { to: "/catch", icon: <IconCamera size={20} />, label: "Scan a receipt", hint: "Photo or SMS text" },
    ],
  },
  {
    title: "Account",
    items: [{ to: "/profile", icon: <IconUser size={20} />, label: "Profile & settings", hint: "Work, spending, cushion" }],
  },
];

export function MoreScreen() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { profile } = useProfile();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <Screen title="More">
      <Card className="p-4 flex items-center gap-3">
        <span className="w-12 h-12 rounded-full bg-brand-700 text-white text-lg font-bold flex items-center justify-center">
          {(profile?.display_name || user?.email || "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{profile?.display_name || "Your account"}</p>
          <p className="text-xs text-ink-muted truncate">{user?.email}</p>
        </div>
      </Card>

      {GROUPS.map((g) => (
        <section key={g.title} className="space-y-2">
          <h2 className="px-1 text-[13px] font-bold text-ink-soft">{g.title}</h2>
          <Card className="p-1 divide-y divide-line">
            {g.items.map((it) => (
              <Link key={it.to} to={it.to} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/[0.03]">
                <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">{it.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-ink">{it.label}</span>
                  <span className="block text-xs text-ink-muted">{it.hint}</span>
                </span>
                <IconChevronRight size={18} className="text-ink-faint" />
              </Link>
            ))}
          </Card>
        </section>
      ))}

      {err ? <Notice tone="danger">{err}</Notice> : null}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await signOut();
            navigate("/login", { replace: true });
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not sign out");
            setBusy(false);
          }
        }}
        className="w-full h-12 rounded-xl bg-white border border-line flex items-center justify-center gap-2 text-[15px] font-semibold text-red-700"
      >
        <IconLogout size={18} /> {busy ? "Signing out…" : "Sign out"}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-faint">
        <IconShield size={14} /> Your data is protected by Supabase row-level security.
      </div>
    </Screen>
  );
}
