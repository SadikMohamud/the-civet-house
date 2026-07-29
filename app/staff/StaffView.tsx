"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import TillPanel from "@/components/TillPanel";
import { theme } from "@/lib/theme";

interface StaffViewProps {
  isOwner: boolean;
}

export default function StaffView({ isOwner }: StaffViewProps) {
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
          <Link
            href="/account"
            className="text-sm text-brand-muted underline underline-offset-2 hover:text-brand"
          >
            Account
          </Link>
          <SignOutButton />
        </div>
      </header>

      <TillPanel />
    </div>
  );
}
