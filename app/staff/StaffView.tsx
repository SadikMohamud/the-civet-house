"use client";

import Link from "next/link";
import { useState } from "react";
import QrScanner from "@/components/QrScanner";
import SignOutButton from "@/components/SignOutButton";
import StampGrid from "@/components/StampGrid";
import { getBrowserClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";
import type { CardStatus, LoyaltySettings } from "@/lib/types";

interface StaffViewProps {
  isOwner: boolean;
}

export default function StaffView({ isOwner }: StaffViewProps) {
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardStatus[]>([]);
  const [customer, setCustomer] = useState<CardStatus | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadSettings(): Promise<LoyaltySettings | null> {
    if (settings) return settings;
    const { data } = await getBrowserClient()
      .from("loyalty_settings")
      .select("*")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setSettings(data);
    return data;
  }

  async function selectCustomer(customerId: string) {
    setScanning(false);
    setResults([]);
    setMessage(null);
    setError(null);
    const supabase = getBrowserClient();
    const [{ data }, loaded] = await Promise.all([
      supabase
        .from("card_status")
        .select("*")
        .eq("customer_id", customerId)
        .maybeSingle(),
      loadSettings(),
    ]);
    if (!data) {
      setError("No customer found for that code.");
      return;
    }
    if (!loaded) {
      setError("The loyalty rule is not configured yet.");
    }
    setCustomer(data);
  }

  // Scans carry the customer's unique card code, not their user id.
  async function selectByCardCode(cardCode: string) {
    setScanning(false);
    setMessage(null);
    setError(null);
    const supabase = getBrowserClient();
    const { data } = await supabase
      .from("card_status")
      .select("customer_id")
      .eq("card_code", cardCode)
      .maybeSingle();
    if (!data) {
      setError("No customer found for that code.");
      return;
    }
    selectCustomer(data.customer_id);
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setCustomer(null);
    const term = query.trim();
    if (term.length < 3) {
      setError("Enter at least 3 characters of an email or name.");
      return;
    }
    const escaped = term.replace(/[%,]/g, "");
    const supabase = getBrowserClient();
    const { data, error: err } = await supabase
      .from("card_status")
      .select("*")
      .or(`email.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
      .limit(8);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("No matching customers. They may need to sign in once first.");
      return;
    }
    if (data.length === 1) {
      selectCustomer(data[0].customer_id);
    } else {
      setResults(data);
    }
  }

  async function addStamp() {
    if (!customer) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const { data, error: err } = await getBrowserClient().rpc("add_stamp", {
      p_customer_id: customer.customer_id,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage(
      data.card_complete
        ? "Stamp added. The card is now complete!"
        : `Stamp added. ${data.stamps_on_card} of ${data.stamps_required}.`
    );
    selectCustomer(customer.customer_id);
  }

  async function redeem() {
    if (!customer) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const { data, error: err } = await getBrowserClient().rpc(
      "redeem_reward",
      { p_customer_id: customer.customer_id }
    );
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage(`Reward redeemed: ${data.reward_description}. Enjoy!`);
    selectCustomer(customer.customer_id);
  }

  const required = settings?.stamps_required ?? 0;
  const complete =
    customer !== null && required > 0 && customer.stamps_on_card >= required;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            {theme.shopName}
          </h1>
          <p className="text-xs text-brand-muted">Staff till</p>
        </div>
        <div className="flex items-center gap-4">
          {isOwner && (
            <Link
              href="/owner"
              className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
            >
              Dashboard
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <section className="rounded-3xl bg-brand-surface p-5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setScanning((s) => !s);
            setError(null);
            setMessage(null);
          }}
          className="w-full rounded-xl bg-brand py-3 font-medium text-brand-on-primary"
        >
          {scanning ? "Stop scanning" : "Scan customer QR"}
        </button>

        {scanning && (
          <div className="mt-4">
            <QrScanner
              onScan={selectByCardCode}
              onError={(msg) => {
                setScanning(false);
                setError(msg);
              }}
            />
          </div>
        )}

        <form onSubmit={search} className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email or name"
            className="min-w-0 flex-1 rounded-xl border border-brand-accent/40 px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
          />
          <button
            type="submit"
            className="rounded-xl border border-brand px-4 py-2.5 text-sm font-medium"
          >
            Look up
          </button>
        </form>
      </section>

      {results.length > 0 && (
        <section className="rounded-3xl bg-brand-surface p-3 shadow-sm">
          {results.map((r) => (
            <button
              key={r.customer_id}
              type="button"
              onClick={() => selectCustomer(r.customer_id)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-brand-accent/10"
            >
              <span className="text-sm">
                {r.display_name || r.email}
              </span>
              <span className="text-xs text-brand-muted">
                {r.stamps_on_card} stamps
              </span>
            </button>
          ))}
        </section>
      )}

      {customer && (
        <section className="rounded-3xl bg-brand-surface p-6 shadow-sm">
          <div className="mb-4 text-center">
            <p className="font-medium">
              {customer.display_name || "Customer"}
            </p>
            <p className="text-xs text-brand-muted">{customer.email}</p>
          </div>

          <StampGrid earned={customer.stamps_on_card} required={required} />

          <p className="mt-4 text-center text-sm text-brand-muted">
            {complete
              ? `Card complete. Reward: ${settings?.reward_description}`
              : `${customer.stamps_on_card} of ${required} stamps`}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={addStamp}
              disabled={busy || complete}
              className="flex-1 rounded-xl bg-brand py-3 font-medium text-brand-on-primary disabled:opacity-40"
            >
              Add stamp
            </button>
            <button
              type="button"
              onClick={redeem}
              disabled={busy || !complete}
              className="flex-1 rounded-xl bg-brand-success py-3 font-medium text-brand-on-primary disabled:opacity-40"
            >
              Redeem reward
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-brand-muted">
            {customer.lifetime_stamps} lifetime stamps,{" "}
            {customer.rewards_redeemed} rewards redeemed
          </p>
        </section>
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
