"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpenText, ListTodo } from "lucide-react";

const TABS = [
  { href: "/", label: "Học", icon: BookOpenText, match: (p: string) => p === "/" || p.startsWith("/decks") },
  { href: "/todos", label: "Việc cần làm", icon: ListTodo, match: (p: string) => p.startsWith("/todos") },
];

export function BottomNav() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-indigo-950/5 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-stretch">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-brand-dark" : "text-foreground/40"
              }`}
            >
              <tab.icon
                className="size-5"
                strokeWidth={active ? 2.5 : 2}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
