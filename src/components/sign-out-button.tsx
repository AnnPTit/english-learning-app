"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Đăng xuất"
      className="flex size-7 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-indigo-50 hover:text-brand-dark"
    >
      <LogOut className="size-4" strokeWidth={2.25} />
    </button>
  );
}
