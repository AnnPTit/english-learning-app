"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
