import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { QuizSession } from "./quiz-session";

export const dynamic = "force-dynamic";

export default async function QuizPage({
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 pb-28">
      <QuizSession
        deckId={deckId}
        deckName={deck.name}
        cards={deck.cards.map((c) => ({
          id: c.id,
          term: c.term,
          meaning: c.meaning,
        }))}
      />
    </main>
  );
}
