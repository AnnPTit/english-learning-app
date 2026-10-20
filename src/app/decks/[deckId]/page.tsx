import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Trash2, Plus, Inbox } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createCard, deleteCard } from "../actions";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const user = await getCurrentUser();

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { cards: { orderBy: { createdAt: "asc" } } },
  });
  if (!deck) notFound();
  if (!deck.isPublic && deck.ownerId !== user.id) notFound();

  const canEdit = deck.ownerId === user.id;

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-5 p-4 pb-28">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-brand-dark"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {deck.name}
          </h1>
          <p className="text-sm text-foreground/50">
            {deck.cards.length} thẻ
          </p>
        </div>
        {deck.cards.length > 0 && (
          <Link
            href={`/decks/${deck.id}/study`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
          >
            <GraduationCap className="size-4" />
            Ôn tập
          </Link>
        )}
      </div>

      <ul className="space-y-2.5">
        {deck.cards.map((card) => (
          <li
            key={card.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-indigo-950/5 bg-white p-3.5 shadow-sm shadow-indigo-950/5"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{card.term}</p>
              <p className="text-sm text-foreground/60">{card.meaning}</p>
              {card.example && (
                <p className="mt-0.5 truncate text-xs text-foreground/35 italic">
                  {card.example}
                </p>
              )}
            </div>
            {canEdit && (
              <form action={deleteCard.bind(null, card.id)}>
                <button
                  type="submit"
                  aria-label="Xóa từ"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-foreground/30 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            )}
          </li>
        ))}
        {deck.cards.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-indigo-950/15 bg-white/60 px-6 py-10 text-center">
            <Inbox className="size-7 text-foreground/25" />
            <p className="text-sm text-foreground/50">
              Deck chưa có từ nào, thêm từ đầu tiên bên dưới.
            </p>
          </div>
        )}
      </ul>

      {canEdit && (
        <form
          action={createCard.bind(null, deck.id)}
          className="space-y-3 rounded-2xl border border-indigo-950/5 bg-white p-4 shadow-sm shadow-indigo-950/5"
        >
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Plus className="size-4 text-brand-dark" />
            Thêm từ mới
          </h2>
          <input
            name="term"
            placeholder="Từ tiếng Anh"
            required
            className="w-full rounded-xl border border-indigo-950/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="meaning"
            placeholder="Nghĩa"
            required
            className="w-full rounded-xl border border-indigo-950/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            name="example"
            placeholder="Câu ví dụ (không bắt buộc)"
            className="w-full rounded-xl border border-indigo-950/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
          >
            Thêm từ
          </button>
        </form>
      )}
    </main>
  );
}
