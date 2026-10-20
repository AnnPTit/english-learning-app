import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDueCards } from "@/lib/decks";
import { StudySession } from "./study-session";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) notFound();
  if (!deck.isPublic && deck.ownerId !== userId) notFound();

  const dueCards = await getDueCards(userId, deckId, 50);

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
