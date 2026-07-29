"use client";

import Link from "next/link";
import { useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import { getBrowserClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";
import type { Role } from "@/lib/types";

interface AccountViewProps {
  email: string;
  role: Role;
}

// Where the "Back" link and header label should point for each role.
const home: Record<Role, { href: string; label: string }> = {
  customer: { href: "/card", label: "My card" },
  staff: { href: "/staff", label: "Staff till" },
  owner: { href: "/owner", label: "Dashboard" },
};

export default function AccountView({ email, role }: AccountViewProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: err } = await getBrowserClient().auth.updateUser({
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage("Password updated. Use your new password next time you sign in.");
  }

  const inputClasses =
    "w-full rounded-xl border border-brand-accent/40 bg-brand-surface px-4 py-3 outline-none focus:border-brand-accent";
  const dest = home[role];

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            {theme.shopName}
          </h1>
          <p className="text-xs text-brand-muted">Account</p>
        </div>
        <Link
          href={dest.href}
          className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
        >
          {dest.label}
        </Link>
      </header>

      <section className="animate-rise rounded-3xl bg-brand-surface p-6 shadow-sm">
        <p className="text-sm text-brand-muted">Signed in as</p>
        <p className="mb-5 font-medium break-all">{email}</p>

        <h2 className="mb-3 font-semibold">Change password</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
            required
          />
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClasses}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-brand py-3 font-medium text-brand-on-primary disabled:opacity-50"
          >
            {busy ? "Saving..." : "Update password"}
          </button>
        </form>

        {message && (
          <p className="animate-rise mt-4 rounded-xl bg-brand-success/10 px-4 py-3 text-center text-sm text-brand-success">
            {message}
          </p>
        )}
        {error && (
          <p className="animate-rise mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <div className="text-center">
        <SignOutButton />
      </div>
    </div>
  );
}
