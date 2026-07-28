"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import SignOutButton from "@/components/SignOutButton";
import StampGrid from "@/components/StampGrid";
import { getBrowserClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";
import type { CardStatus, LoyaltySettings } from "@/lib/types";

interface CardViewProps {
  userId: string;
}

export default function CardView({ userId }: CardViewProps) {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [status, setStatus] = useState<CardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);

  const load = useCallback(async () => {
    const supabase = getBrowserClient();
    const [settingsRes, statusRes] = await Promise.all([
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
        .eq("customer_id", userId)
        .maybeSingle(),
    ]);
    if (settingsRes.data) setSettings(settingsRes.data);
    if (statusRes.data) {
      setStatus(statusRes.data);
      setName(statusRes.data.display_name ?? "");
    }
    setLoading(false);
  }, [userId]);

  // Refresh on load, when the app regains focus, and every 10 seconds,
  // so a fresh stamp appears while the customer is at the till.
  useEffect(() => {
    // load is async, so its state updates land in later microtasks,
    // not synchronously within the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 10000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserClient();
    await supabase
      .from("profiles")
      .update({ display_name: name.trim() || null })
      .eq("id", userId);
    setEditingName(false);
    load();
  }

  const required = settings?.stamps_required ?? 0;
  const earned = status?.stamps_on_card ?? 0;
  const complete = required > 0 && earned >= required;
  const remaining = Math.max(required - earned, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={theme.logo.src}
            alt={theme.logo.alt}
            width={44}
            height={44}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              {theme.shopName}
            </h1>
            <p className="text-xs text-brand-muted">Loyalty card</p>
          </div>
        </div>
        <SignOutButton />
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-brand-muted">
          Loading your card...
        </div>
      ) : (
        <>
          <section className="card-premium animate-rise rounded-3xl p-6 shadow-lg">
            <div className="relative z-10">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-brand-on-primary/60">
                    {theme.shopName}
                  </p>
                  {editingName ? (
                    <form
                      onSubmit={saveName}
                      className="mt-1 flex gap-2"
                    >
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-32 rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-brand-on-primary placeholder:text-brand-on-primary/50 outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-accent px-3 py-1 text-sm font-medium text-brand"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="mt-0.5 text-lg font-semibold text-brand-on-primary"
                    >
                      {status?.display_name
                        ? status.display_name
                        : "Add your name"}
                    </button>
                  )}
                </div>
                <span className="rounded-full border border-brand-accent/50 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-brand-accent">
                  Member
                </span>
              </div>

              <StampGrid earned={earned} required={required} tone="light" />

              <p className="mt-5 text-center text-sm text-brand-on-primary/70">
                {required === 0
                  ? "Your card is being set up. Check back soon."
                  : complete
                    ? "Your card is full. Reward ready!"
                    : `${remaining} more ${remaining === 1 ? "stamp" : "stamps"} until ${settings?.reward_description ?? "your reward"}`}
              </p>
            </div>
          </section>

          {complete && settings && (
            <section className="animate-pop-in overflow-hidden rounded-3xl shadow-sm">
              <div className="shimmer px-5 py-5 text-center text-brand">
                <p className="text-lg font-semibold">Reward unlocked</p>
                <p className="mt-1 text-sm font-medium">
                  {settings.reward_description}. Show this screen to a barista.
                </p>
              </div>
            </section>
          )}

          {status && (
            <section className="animate-rise rounded-3xl bg-brand-surface p-6 text-center shadow-sm">
              <p className="mb-4 text-sm text-brand-muted">
                {complete
                  ? "Have this scanned to claim your reward"
                  : "Show this at the till to collect your stamp"}
              </p>
              <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-inner">
                <QRCode value={status.card_code} size={176} />
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Unique to you &middot; one stamp per day
              </p>
            </section>
          )}

          {status && status.rewards_redeemed > 0 && (
            <p className="text-center text-xs text-brand-muted">
              {status.rewards_redeemed}{" "}
              {status.rewards_redeemed === 1 ? "reward" : "rewards"} enjoyed so
              far
            </p>
          )}
        </>
      )}
    </div>
  );
}
