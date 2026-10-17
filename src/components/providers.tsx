"use client";

import { SessionProvider } from "next-auth/react";
import { SerwistProvider } from "@serwist/turbopack/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <SessionProvider>{children}</SessionProvider>
    </SerwistProvider>
  );
}
