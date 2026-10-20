import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getDueCards } from "@/lib/decks";
import { StudySession } from "./study-session";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const user = await getCurrentUser();

  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) notFound();
  if (!deck.isPublic && deck.ownerId !== user.id) notFound();

  const dueCards = await getDueCards(user.id, deckId, 50);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 pb-28">
      <StudySession
        deckId={deckId}
        deckName={deck.name}
        initialCards={dueCards.map((c) => ({
          id: c.id,
          term: c.term,
          meaning: c.meaning,
          example: c.example,
        }))}
      />
    </main>
  );
}
