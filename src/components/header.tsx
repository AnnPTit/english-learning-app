import Link from "next/link";
import { BookOpenText } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-indigo-950/5 bg-white/80 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm shadow-indigo-300">
            <BookOpenText className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="font-semibold tracking-tight text-foreground">
            Học Tiếng Anh
          </span>
        </Link>
      </div>
    </header>
  );
}
