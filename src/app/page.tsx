import { getServerSession } from "next-auth/next";
import Link from "next/link";
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

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bộ từ của bạn</h1>
        <Link href="/decks/new" className="text-sm underline">
          + Tạo deck
        </Link>
      </div>

      {decksWithDue.length === 0 && (
        <p className="text-sm text-black/60">
          Chưa có deck nào, tạo deck đầu tiên để bắt đầu học.
        </p>
      )}

      <ul className="space-y-2">
        {decksWithDue.map((deck) => (
          <li key={deck.id} className="rounded-lg border border-black/10 p-4">
            <p className="font-medium">{deck.name}</p>
            <p className="text-sm text-black/60">
              {deck._count.cards} thẻ · {deck.dueCount} thẻ cần ôn hôm nay
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link href={`/decks/${deck.id}`} className="underline">
                Quản lý
              </Link>
              {deck.dueCount > 0 && (
                <Link
                  href={`/decks/${deck.id}/study`}
                  className="font-medium text-blue-600 underline"
                >
                  Ôn ngay
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
