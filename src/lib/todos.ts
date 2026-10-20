import { prisma } from "@/lib/prisma";

export function listTodos(userId: string) {
  return prisma.todo.findMany({
    where: { userId },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  });
}
