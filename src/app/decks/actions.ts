"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitReview as submitReviewToDb } from "@/lib/decks";
import type { Rating } from "@/lib/srs";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  return session.user;
}

async function assertCanEditDeck(deckId: string, userId: string, role: string) {
  const deck = await prisma.deck.findUniqueOrThrow({ where: { id: deckId } });
  if (deck.ownerId !== userId && role !== "ADMIN") {
    throw new Error("Bạn không có quyền sửa deck này");
  }
  return deck;
}

export async function createDeck(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Tên deck không được để trống");

  const deck = await prisma.deck.create({ data: { name, ownerId: user.id } });
  revalidatePath("/");
  redirect(`/decks/${deck.id}`);
}

export async function createCard(deckId: string, formData: FormData) {
  const user = await requireUser();
  await assertCanEditDeck(deckId, user.id, user.role);

  const term = String(formData.get("term") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const example = String(formData.get("example") ?? "").trim() || null;
  if (!term || !meaning) throw new Error("Thiếu từ hoặc nghĩa");

  await prisma.card.create({ data: { deckId, term, meaning, example } });
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/");
}

export async function deleteCard(cardId: string) {
  const user = await requireUser();
  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });
  await assertCanEditDeck(card.deckId, user.id, user.role);

  await prisma.card.delete({ where: { id: cardId } });
  revalidatePath(`/decks/${card.deckId}`);
  revalidatePath("/");
}

export async function submitReviewAction(deckId: string, cardId: string, rating: Rating) {
  const user = await requireUser();
  await submitReviewToDb(user.id, cardId, rating);
  revalidatePath(`/decks/${deckId}/study`);
  revalidatePath("/");
}
