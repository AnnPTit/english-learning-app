import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function Header() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
      <Link href="/" className="font-medium">
        Học Tiếng Anh
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-black/60">{session.user.name}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
