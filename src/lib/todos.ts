import { prisma } from "@/lib/prisma";
import { addDays, todayDateString } from "@/lib/date";

export function listTodosByDate(userId: string, date: string) {
  return prisma.todo.findMany({
    where: { userId, date },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  });
}

export type DailyStat = {
  date: string;
  total: number;
  completed: number;
  allDone: boolean;
};

/** Thống kê hoàn thành todo của `numDays` ngày gần nhất (tính cả hôm nay), cũ -> mới. */
export async function getDailyStats(
  userId: string,
  numDays: number,
): Promise<DailyStat[]> {
  const today = todayDateString();
  const dates: string[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    dates.push(addDays(today, -i));
  }

  const todos = await prisma.todo.findMany({
    where: { userId, date: { gte: dates[0] } },
    select: { date: true, completed: true },
  });

  const byDate = new Map<string, { total: number; completed: number }>();
  for (const todo of todos) {
    const entry = byDate.get(todo.date) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (todo.completed) entry.completed += 1;
    byDate.set(todo.date, entry);
  }

  return dates.map((date) => {
    const entry = byDate.get(date) ?? { total: 0, completed: 0 };
    return {
      date,
      ...entry,
      allDone: entry.total > 0 && entry.completed === entry.total,
    };
  });
}
