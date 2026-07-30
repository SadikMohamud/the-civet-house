"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { getBrowserClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = getBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        err.message === "Email not confirmed"
          ? "Please confirm your email first. Check your inbox for the link."
          : "That email and password did not match. Please try again."
      );
    } else {
      router.replace("/");
      router.refresh();
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    const supabase = getBrowserClient();
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    // If confirmation is required, there is no active session yet.
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setConfirmSent(true);
    }
  }

  const inputClasses =
    "w-full rounded-xl border border-brand-accent/40 bg-brand-surface px-4 py-3 text-brand outline-none focus:border-brand-accent";
  const buttonClasses =
    "w-full rounded-xl bg-brand py-3 font-medium text-brand-on-primary disabled:opacity-50";

  if (confirmSent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10 text-center">
        <Logo className="mx-auto h-16 w-auto" />
        <div className="rounded-2xl bg-brand-surface p-6">
          <h1 className="text-lg font-semibold">Almost there</h1>
          <p className="mt-2 text-sm text-brand-muted">
            We have sent a confirmation email to {email}. Open it and tap the
            link to activate your card, then come back and sign in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setConfirmSent(false);
            setMode("signin");
            setPassword("");
          }}
          className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <Link
          href="/install"
          className="mb-6 inline-block rounded-full bg-brand-accent/15 px-4 py-1.5 text-xs font-medium text-brand hover:bg-brand-accent/25"
        >
          Add this app to your phone
        </Link>
        <Logo className="mx-auto mb-4 h-20 w-auto" priority />
        <p className="text-sm text-brand-muted">{theme.tagline}</p>
      </div>

      <div className="flex rounded-xl bg-brand-accent/15 p-1 text-sm font-medium">
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              mode === value ? "bg-brand-surface shadow-sm" : "text-brand-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={mode === "signin" ? signIn : signUp}
        className="flex flex-col gap-3"
      >
        <label className="text-sm font-medium" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
          required
        />

        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "At least 8 characters" : ""}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses}
          required
        />

        <button type="submit" disabled={busy} className={buttonClasses}>
          {busy
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-brand-muted">
        {mode === "signin"
          ? "New here? Choose Create account to join the loyalty scheme."
          : "We will email you a link to confirm your address."}
      </p>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
