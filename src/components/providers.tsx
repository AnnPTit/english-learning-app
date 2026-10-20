"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { SerwistProvider } from "@serwist/turbopack/react";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <SessionProvider session={session}>{children}</SessionProvider>
    </SerwistProvider>
  );
}
