"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import { getBrowserClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";
import type { CardStatus, LoyaltySettings, Profile } from "@/lib/types";

export default function OwnerView() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [customers, setCustomers] = useState<CardStatus[]>([]);
  const [team, setTeam] = useState<Profile[]>([]);
  const [stampsRequired, setStampsRequired] = useState("9");
  const [reward, setReward] = useState("");
  const [promoteQuery, setPromoteQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getBrowserClient();
    const [settingsRes, customersRes, teamRes] = await Promise.all([
      supabase
        .from("loyalty_settings")
        .select("*")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("card_status")
        .select("*")
        .order("last_stamp_at", { ascending: false, nullsFirst: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("*")
        .in("role", ["staff", "owner"])
        .order("created_at"),
    ]);
    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setStampsRequired(String(settingsRes.data.stamps_required));
      setReward(settingsRes.data.reward_description);
    }
    setCustomers(customersRes.data ?? []);
    setTeam(teamRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // load is async, so its state updates land in later microtasks,
    // not synchronously within the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const required = Number(stampsRequired);
    if (!Number.isInteger(required) || required < 1 || required > 50) {
      setError("Stamps required must be a whole number between 1 and 50.");
      return;
    }
    if (!reward.trim()) {
      setError("Please describe the reward.");
      return;
    }
    setBusy(true);
    const supabase = getBrowserClient();
    const payload = {
      stamps_required: required,
      reward_description: reward.trim(),
    };
    const { error: err } = settings
      ? await supabase
          .from("loyalty_settings")
          .update(payload)
          .eq("id", settings.id)
      : await supabase.from("loyalty_settings").insert(payload);
    setBusy(false);
    if (err) {
      setError(err.message);
    } else {
      setMessage("Loyalty rule saved.");
      load();
    }
  }

  async function setRole(profileId: string, role: "staff" | "customer") {
    setError(null);
    setMessage(null);
    const { error: err } = await getBrowserClient()
      .from("profiles")
      .update({ role })
      .eq("id", profileId);
    if (err) {
      setError(err.message);
    } else {
      setMessage(role === "staff" ? "Staff member added." : "Staff access removed.");
      load();
    }
  }

  async function promote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const term = promoteQuery.trim();
    if (!term) return;
    const escaped = term.replace(/[%,]/g, "");
    const supabase = getBrowserClient();
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
      .eq("role", "customer")
      .limit(2);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("No matching customer. They need to create an account and confirm their email once first.");
      return;
    }
    if (data.length > 1) {
      setError("More than one match. Use the full email address.");
      return;
    }
    setPromoteQuery("");
    await setRole(data[0].id, "staff");
  }

  const totalStamps = customers.reduce((n, c) => n + c.lifetime_stamps, 0);
  const totalRedeemed = customers.reduce((n, c) => n + c.rewards_redeemed, 0);

  const cardClasses = "rounded-3xl bg-brand-surface p-6 shadow-sm";
  const inputClasses =
    "w-full rounded-xl border border-brand-accent/40 px-4 py-2.5 text-sm outline-none focus:border-brand-accent";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            {theme.shopName}
          </h1>
          <p className="text-xs text-brand-muted">Owner dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/staff"
            className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
          >
            Staff till
          </Link>
          <SignOutButton />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-brand-muted">
          Loading...
        </div>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-3">
            {[
              { label: "Customers", value: customers.length },
              { label: "Stamps issued", value: totalStamps },
              { label: "Rewards redeemed", value: totalRedeemed },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-brand-surface p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-brand-muted">{stat.label}</p>
              </div>
            ))}
          </section>

          <section className={cardClasses}>
            <h2 className="mb-4 font-semibold">Loyalty rule</h2>
            <form onSubmit={saveSettings} className="flex flex-col gap-3">
              <label className="text-sm" htmlFor="stamps-required">
                Stamps required for a reward
              </label>
              <input
                id="stamps-required"
                type="number"
                min={1}
                max={50}
                value={stampsRequired}
                onChange={(e) => setStampsRequired(e.target.value)}
                className={inputClasses}
              />
              <label className="text-sm" htmlFor="reward">
                Reward
              </label>
              <input
                id="reward"
                type="text"
                placeholder="A free coffee on us"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className={inputClasses}
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-1 rounded-xl bg-brand py-3 font-medium text-brand-on-primary disabled:opacity-50"
              >
                Save rule
              </button>
            </form>
          </section>

          <section className={cardClasses}>
            <h2 className="mb-4 font-semibold">Team</h2>
            <ul className="mb-4 flex flex-col gap-2">
              {team.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-xl bg-brand-accent/10 px-4 py-2.5 text-sm"
                >
                  <span>
                    {member.display_name || member.email}
                    <span className="ml-2 text-xs text-brand-muted capitalize">
                      {member.role}
                    </span>
                  </span>
                  {member.role === "staff" && (
                    <button
                      type="button"
                      onClick={() => setRole(member.id, "customer")}
                      className="text-xs text-red-700 underline underline-offset-2"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={promote} className="flex gap-2">
              <input
                value={promoteQuery}
                onChange={(e) => setPromoteQuery(e.target.value)}
                placeholder="Email of new staff"
                className="min-w-0 flex-1 rounded-xl border border-brand-accent/40 px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
              />
              <button
                type="submit"
                className="rounded-xl border border-brand px-4 py-2.5 text-sm font-medium"
              >
                Add staff
              </button>
            </form>
          </section>

          <section className={cardClasses}>
            <h2 className="mb-4 font-semibold">Customers</h2>
            {customers.length === 0 ? (
              <p className="text-sm text-brand-muted">
                No customers yet. They appear here after their first sign in.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-brand-muted">
                      <th className="pb-2 pr-3 font-medium">Customer</th>
                      <th className="pb-2 pr-3 font-medium">Card</th>
                      <th className="pb-2 pr-3 font-medium">Lifetime</th>
                      <th className="pb-2 font-medium">Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.customer_id}
                        className="border-t border-brand-accent/15"
                      >
                        <td className="py-2.5 pr-3">
                          {c.display_name || c.email}
                        </td>
                        <td className="py-2.5 pr-3">
                          {c.stamps_on_card}
                          {settings ? ` / ${settings.stamps_required}` : ""}
                        </td>
                        <td className="py-2.5 pr-3">{c.lifetime_stamps}</td>
                        <td className="py-2.5">{c.rewards_redeemed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {message && (
        <p className="rounded-xl bg-brand-success/10 px-4 py-3 text-center text-sm text-brand-success">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
