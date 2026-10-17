import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDueCards, submitReview } from "../src/lib/decks";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`OK: ${message}`);
}

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });

  const deck = await prisma.deck.create({
    data: {
      name: "__test_deck__",
      ownerId: admin.id,
      isPublic: false,
      cards: {
        create: [
          { term: "apple", meaning: "quả táo" },
          { term: "banana", meaning: "quả chuối" },
        ],
      },
    },
    include: { cards: true },
  });
  const [card1, card2] = deck.cards;

  const due1 = await getDueCards(admin.id, deck.id);
  assert(due1.length === 2, "2 thẻ mới chưa ôn đều hiện ra là 'đến hạn'");

  await submitReview(admin.id, card1.id, "hard");
  const log1 = await prisma.reviewLog.findUniqueOrThrow({
    where: { userId_cardId: { userId: admin.id, cardId: card1.id } },
  });
  assert(log1.repetition === 1, `repetition sau 1 lần 'hard' phải là 1, thực tế ${log1.repetition}`);
  assert(log1.interval === 1, `interval sau lần ôn đầu tiên phải là 1, thực tế ${log1.interval}`);
  assert(
    Math.abs(log1.easeFactor - 2.36) < 1e-9,
    `easeFactor sau 1 lần 'hard' phải là 2.36, thực tế ${log1.easeFactor}`,
  );

  await submitReview(admin.id, card2.id, "very_easy");
  const log2 = await prisma.reviewLog.findUniqueOrThrow({
    where: { userId_cardId: { userId: admin.id, cardId: card2.id } },
  });
  assert(
    Math.abs(log2.easeFactor - 2.6) < 1e-9,
    `easeFactor sau 1 lần 'very_easy' phải là 2.6, thực tế ${log2.easeFactor}`,
  );

  const due2 = await getDueCards(admin.id, deck.id);
  assert(due2.length === 0, "cả 2 thẻ vừa ôn xong, chưa đến hạn lại, danh sách due phải rỗng");

  // Giả lập thời gian trôi qua: đẩy dueDate của card1 về quá khứ.
  await prisma.reviewLog.update({
    where: { userId_cardId: { userId: admin.id, cardId: card1.id } },
    data: { dueDate: new Date(Date.now() - 1000) },
  });
  const due3 = await getDueCards(admin.id, deck.id);
  assert(due3.length === 1 && due3[0].id === card1.id, "card1 quá hạn phải xuất hiện lại trong danh sách due");

  await submitReview(admin.id, card1.id, "hard");
  const log1b = await prisma.reviewLog.findUniqueOrThrow({
    where: { userId_cardId: { userId: admin.id, cardId: card1.id } },
  });
  assert(log1b.repetition === 2, `repetition sau lần 'hard' thứ 2 phải là 2, thực tế ${log1b.repetition}`);
  assert(log1b.interval === 6, `interval ở repetition=2 luôn là 6, thực tế ${log1b.interval}`);

  await submitReview(admin.id, card1.id, "forgot");
  const log1c = await prisma.reviewLog.findUniqueOrThrow({
    where: { userId_cardId: { userId: admin.id, cardId: card1.id } },
  });
  assert(log1c.repetition === 0, "quên bài phải reset repetition về 0");
  assert(log1c.interval === 1, "quên bài phải đặt lại interval về 1 (ôn lại ngày mai)");

  await prisma.deck.delete({ where: { id: deck.id } });
  console.log("\nAll SRS checks passed. Cleaned up test deck.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
