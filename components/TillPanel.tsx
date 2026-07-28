"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "@/components/QrScanner";
import StampGrid from "@/components/StampGrid";
import { getBrowserClient } from "@/lib/supabase/client";
import type { CardStatus, LoyaltySettings } from "@/lib/types";

type ResultKind = "stamped" | "already_today" | "complete" | "redeemed";

interface Result {
  kind: ResultKind;
  name: string;
  stampsOnCard: number;
  stampsRequired: number;
  cardComplete: boolean;
  customerId: string;
}

interface TillPanelProps {
  // Called after a stamp or redeem succeeds, so a parent (the owner
  // dashboard) can refresh its counts.
  onStampChange?: () => void;
}

// Continuous scan-and-stamp till. The camera stays live; each scanned
// customer is stamped automatically (once per day), with a result shown
// for a moment before scanning resumes. A completed card offers redeem.
export default function TillPanel({ onStampChange }: TillPanelProps) {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLookup, setShowLookup] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CardStatus[]>([]);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSettings = useCallback(async () => {
    const { data } = await getBrowserClient()
      .from("loyalty_settings")
      .select("*")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setSettings(data);
  }, []);

  useEffect(() => {
    // Async: state updates land in a later microtask, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const clearResume = () => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };
  useEffect(() => clearResume, []);

  const resumeScanning = useCallback(() => {
    clearResume();
    setResult(null);
    setError(null);
    setPaused(false);
  }, []);

  const scheduleResume = useCallback(
    (ms: number) => {
      clearResume();
      resumeTimer.current = setTimeout(resumeScanning, ms);
    },
    [resumeScanning]
  );

  const stamp = useCallback(
    async (customerId: string, name: string) => {
      setBusy(true);
      setError(null);
      const { data, error: err } = await getBrowserClient().rpc("add_stamp", {
        p_customer_id: customerId,
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        setPaused(false);
        return;
      }
      const kind = data.status as ResultKind;
      setResult({
        kind,
        name,
        stampsOnCard: data.stamps_on_card,
        stampsRequired: data.stamps_required,
        cardComplete: data.card_complete,
        customerId,
      });
      onStampChange?.();
      // Auto-resume for the routine outcomes; wait for staff when a
      // reward is now claimable.
      if (kind === "stamped" && !data.card_complete) scheduleResume(3200);
      else if (kind === "already_today") scheduleResume(3200);
    },
    [onStampChange, scheduleResume]
  );

  const handleScan = useCallback(
    async (cardCode: string) => {
      setPaused(true);
      clearResume();
      setError(null);
      const { data } = await getBrowserClient()
        .from("card_status")
        .select("customer_id, display_name")
        .eq("card_code", cardCode)
        .maybeSingle();
      if (!data) {
        setError("Card not recognised. Try again, or look them up by email.");
        setPaused(false);
        return;
      }
      await stamp(data.customer_id, data.display_name || "Customer");
    },
    [stamp]
  );

  const redeem = useCallback(async () => {
    if (!result) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getBrowserClient().rpc("redeem_reward", {
      p_customer_id: result.customerId,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResult({ ...result, kind: "redeemed" });
    onStampChange?.();
    scheduleResume(3500);
  }, [result, onStampChange, scheduleResume]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMatches([]);
    const term = query.trim();
    if (term.length < 3) {
      setError("Enter at least 3 characters of an email or name.");
      return;
    }
    const escaped = term.replace(/[%,]/g, "");
    const { data, error: err } = await getBrowserClient()
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
    setMatches(data);
  }

  async function pickMatch(m: CardStatus) {
    setMatches([]);
    setQuery("");
    setShowLookup(false);
    setPaused(true);
    await stamp(m.customer_id, m.display_name || m.email || "Customer");
  }

  const rewardText = settings?.reward_description ?? "your reward";

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-3xl bg-brand-surface p-4 shadow-sm">
        {result ? (
          <ResultCard
            result={result}
            rewardText={rewardText}
            busy={busy}
            onRedeem={redeem}
            onDone={resumeScanning}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="font-semibold">Scan to stamp</p>
              <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-success" />
                </span>
                Camera live
              </span>
            </div>
            <QrScanner
              onScan={handleScan}
              onError={(msg) => setError(msg)}
              paused={paused}
            />
            <p className="px-1 text-center text-xs text-brand-muted">
              Point at a customer&rsquo;s QR code. One stamp per day is added
              automatically.
            </p>
          </div>
        )}
      </section>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setShowLookup((s) => !s);
            setError(null);
            setMatches([]);
          }}
          className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
        >
          {showLookup ? "Hide lookup" : "No QR? Look up by email"}
        </button>
      </div>

      {showLookup && (
        <section className="animate-rise rounded-3xl bg-brand-surface p-4 shadow-sm">
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Email or name"
              className="min-w-0 flex-1 rounded-xl border border-brand-accent/40 px-4 py-2.5 outline-none focus:border-brand-accent"
            />
            <button
              type="submit"
              className="rounded-xl border border-brand px-4 py-2.5 font-medium"
            >
              Find
            </button>
          </form>
          {matches.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {matches.map((m) => (
                <li key={m.customer_id}>
                  <button
                    type="button"
                    onClick={() => pickMatch(m)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-brand-accent/10"
                  >
                    <span>{m.display_name || m.email}</span>
                    <span className="text-xs text-brand-muted">
                      {m.stamps_on_card} stamps
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && (
        <p className="animate-rise rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function ResultCard({
  result,
  rewardText,
  busy,
  onRedeem,
  onDone,
}: {
  result: Result;
  rewardText: string;
  busy: boolean;
  onRedeem: () => void;
  onDone: () => void;
}) {
  const { kind, name, stampsOnCard, stampsRequired, cardComplete } = result;
  const rewardReady = kind === "complete" || (kind === "stamped" && cardComplete);

  return (
    <div className="animate-pop-in flex flex-col items-center gap-4 px-2 py-4 text-center">
      {kind === "already_today" ? (
        <>
          <Badge tone="muted">Already stamped today</Badge>
          <p className="text-sm text-brand-muted">
            {name} has today&rsquo;s stamp. See them again tomorrow.
          </p>
          <StampGrid earned={stampsOnCard} required={stampsRequired} />
        </>
      ) : kind === "redeemed" ? (
        <>
          <Sparkle />
          <p className="text-xl font-semibold text-brand">Enjoy {rewardText}</p>
          <p className="text-sm text-brand-muted">
            Reward redeemed for {name}. A fresh card starts now.
          </p>
        </>
      ) : rewardReady ? (
        <>
          <Sparkle />
          <p className="text-xl font-semibold text-brand">Reward unlocked</p>
          <p className="text-sm text-brand-muted">
            {name}&rsquo;s card is full. Give them {rewardText}.
          </p>
          <StampGrid
            earned={stampsOnCard}
            required={stampsRequired}
            animateLast={kind === "stamped"}
          />
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/20 text-brand">
            <CupBig />
          </div>
          <div>
            <p className="text-lg font-semibold">Stamp added</p>
            <p className="text-sm text-brand-muted">
              {name} &middot; {stampsOnCard} of {stampsRequired}
            </p>
          </div>
          <StampGrid
            earned={stampsOnCard}
            required={stampsRequired}
            animateLast
          />
        </>
      )}

      {rewardReady && (
        <div className="flex w-full gap-3 pt-1">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 rounded-xl border border-brand py-3 font-medium"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onRedeem}
            disabled={busy}
            className="flex-1 rounded-xl bg-brand-success py-3 font-medium text-brand-on-primary disabled:opacity-50"
          >
            Redeem
          </button>
        </div>
      )}

      {!rewardReady && (
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
        >
          Scan next customer
        </button>
      )}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "muted";
}) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        tone === "muted" ? "bg-brand-accent/15 text-brand" : ""
      }`}
    >
      {children}
    </span>
  );
}

function Sparkle() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-success/15 text-brand-success">
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9z" />
        <circle cx="18.5" cy="17.5" r="1.6" />
        <circle cx="5.5" cy="16.5" r="1.2" />
      </svg>
    </div>
  );
}

function CupBig() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9h11v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="currentColor" stroke="none" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M9 3.5c-.5.8-.5 1.7 0 2.5M12.5 3.5c-.5.8-.5 1.7 0 2.5" />
    </svg>
  );
}
