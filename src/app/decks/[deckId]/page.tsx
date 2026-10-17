import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCard, deleteCard } from "../actions";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { cards: { orderBy: { createdAt: "asc" } } },
  });
  if (!deck) notFound();
  if (!deck.isPublic && deck.ownerId !== userId) notFound();

  const canEdit = deck.ownerId === userId || session!.user.role === "ADMIN";

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 p-4">
      <Link href="/" className="text-sm underline">
        ← Quay lại
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{deck.name}</h1>
        {deck.cards.length > 0 && (
          <Link
            href={`/decks/${deck.id}/study`}
            className="text-sm font-medium text-blue-600 underline"
          >
            Ôn tập
          </Link>
        )}
      </div>

      <ul className="space-y-2">
        {deck.cards.map((card) => (
          <li
            key={card.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-black/10 p-3"
          >
            <div>
              <p className="font-medium">{card.term}</p>
              <p className="text-sm text-black/60">{card.meaning}</p>
              {card.example && (
                <p className="text-xs italic text-black/40">
                  {card.example}
                </p>
              )}
            </div>
            {canEdit && (
              <form action={deleteCard.bind(null, card.id)}>
                <button type="submit" className="text-xs text-red-600 underline">
                  Xóa
                </button>
              </form>
            )}
          </li>
        ))}
        {deck.cards.length === 0 && (
          <p className="text-sm text-black/60">Deck chưa có từ nào.</p>
        )}
      </ul>

      {canEdit && (
        <form
          action={createCard.bind(null, deck.id)}
          className="space-y-2 rounded-lg border border-black/10 p-4"
        >
          <h2 className="font-medium">Thêm từ mới</h2>
          <input
            name="term"
            placeholder="Từ tiếng Anh"
            required
            className="w-full rounded border border-black/20 px-3 py-2"
          />
          <input
            name="meaning"
            placeholder="Nghĩa"
            required
            className="w-full rounded border border-black/20 px-3 py-2"
          />
          <input
            name="example"
            placeholder="Câu ví dụ (không bắt buộc)"
            className="w-full rounded border border-black/20 px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded bg-black py-2 text-white"
          >
            Thêm
          </button>
        </form>
      )}
    </main>
  );
}
