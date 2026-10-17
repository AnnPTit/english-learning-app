import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { Plus, Layers, Flame, ChevronRight, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listVisibleDecks, countDueCards } from "@/lib/decks";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const decks = await listVisibleDecks(userId);
  const decksWithDue = await Promise.all(
    decks.map(async (deck) => ({
      ...deck,
      dueCount: await countDueCards(userId, deck.id),
    })),
  );

  const totalDue = decksWithDue.reduce((sum, d) => sum + d.dueCount, 0);
  const firstName = session!.user.name?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4 pb-10">
      <div className="space-y-1 pt-2">
        <h1 className="text-xl font-semibold text-foreground">
          Chào, {firstName} 👋
        </h1>
        <p className="text-sm text-foreground/50">
          {totalDue > 0
            ? `Hôm nay bạn có ${totalDue} thẻ cần ôn tập.`
            : "Không có thẻ nào đến hạn hôm nay, làm tốt lắm!"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-foreground/70 uppercase">
          Bộ từ của bạn
        </h2>
        <Link
          href="/decks/new"
          className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          Tạo deck
        </Link>
      </div>

      {decksWithDue.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-indigo-950/15 bg-white/60 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-brand-dark">
            <Sparkles className="size-6" />
          </span>
          <p className="text-sm text-foreground/60">
            Chưa có deck nào, tạo deck đầu tiên để bắt đầu học.
          </p>
          <Link
            href="/decks/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
          >
            <Plus className="size-4" />
            Tạo deck đầu tiên
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {decksWithDue.map((deck) => {
          const progress =
            deck._count.cards > 0
              ? Math.round(
                  ((deck._count.cards - deck.dueCount) / deck._count.cards) *
                    100,
                )
              : 0;

          return (
            <li
              key={deck.id}
              className="rounded-2xl border border-indigo-950/5 bg-white p-4 shadow-sm shadow-indigo-950/5 transition-shadow hover:shadow-md hover:shadow-indigo-950/10"
            >
              <Link
                href={`/decks/${deck.id}`}
                className="group flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-brand-dark">
                    <Layers className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{deck.name}</p>
                    <p className="text-xs text-foreground/50">
                      {deck._count.cards} thẻ
                    </p>
                  </div>
                </div>
                <ChevronRight className="mt-2 size-4 shrink-0 text-foreground/20 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-indigo-950/5">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {deck.dueCount > 0 ? (
                  <Link
                    href={`/decks/${deck.id}/study`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-200"
                  >
                    <Flame className="size-3" />
                    Ôn {deck.dueCount} thẻ
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs font-medium text-emerald-600">
                    Đã xong
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
