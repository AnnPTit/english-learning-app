import { prisma } from "@/lib/prisma";
import { addDays, reviewCard, RATING_TO_QUALITY, type Rating } from "@/lib/srs";

/** Các deck mà user thấy được: deck công khai (do admin tạo) hoặc deck của chính họ. */
export function listVisibleDecks(userId: string) {
  return prisma.deck.findMany({
    where: { OR: [{ isPublic: true }, { ownerId: userId }] },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Lấy các thẻ đến hạn ôn hôm nay cho một user trong một deck: thẻ chưa từng ôn
 * (chưa có ReviewLog) hoặc đã đến hoặc quá hạn `dueDate`.
 */
export async function getDueCards(userId: string, deckId: string, limit = 20) {
  return prisma.card.findMany({
    where: {
      deckId,
      OR: [
        { reviewLogs: { none: { userId } } },
        { reviewLogs: { some: { userId, dueDate: { lte: new Date() } } } },
      ],
    },
    include: {
      reviewLogs: { where: { userId } },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
}

/** Đếm số thẻ đến hạn ôn, dùng để hiển thị badge ở trang danh sách deck. */
export function countDueCards(userId: string, deckId: string) {
  return prisma.card.count({
    where: {
      deckId,
      OR: [
        { reviewLogs: { none: { userId } } },
        { reviewLogs: { some: { userId, dueDate: { lte: new Date() } } } },
      ],
    },
  });
}

/** Ghi nhận kết quả ôn một thẻ, cập nhật lịch SM-2 cho lần ôn tiếp theo. */
export async function submitReview(userId: string, cardId: string, rating: Rating) {
  const quality = RATING_TO_QUALITY[rating];

  const existing = await prisma.reviewLog.findUnique({
    where: { userId_cardId: { userId, cardId } },
  });

  const prevState = existing
    ? {
        repetition: existing.repetition,
        easeFactor: existing.easeFactor,
        interval: existing.interval,
      }
    : { repetition: 0, easeFactor: 2.5, interval: 0 };

  const nextState = reviewCard(prevState, quality);
  const dueDate = addDays(new Date(), nextState.interval);

  return prisma.reviewLog.upsert({
    where: { userId_cardId: { userId, cardId } },
    update: { ...nextState, dueDate, lastReviewedAt: new Date() },
    create: { userId, cardId, ...nextState, dueDate, lastReviewedAt: new Date() },
  });
}
