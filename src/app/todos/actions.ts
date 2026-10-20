"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function createTodo(formData: FormData) {
  const user = await getCurrentUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.todo.create({ data: { userId: user.id, title } });
  revalidatePath("/todos");
}

export async function toggleTodo(todoId: string) {
  const user = await getCurrentUser();
  const todo = await prisma.todo.findUniqueOrThrow({ where: { id: todoId } });
  if (todo.userId !== user.id) throw new Error("Không có quyền sửa việc này");

  await prisma.todo.update({
    where: { id: todoId },
    data: { completed: !todo.completed },
  });
  revalidatePath("/todos");
}

export async function deleteTodo(todoId: string) {
  const user = await getCurrentUser();
  const todo = await prisma.todo.findUniqueOrThrow({ where: { id: todoId } });
  if (todo.userId !== user.id) throw new Error("Không có quyền xóa việc này");

  await prisma.todo.delete({ where: { id: todoId } });
  revalidatePath("/todos");
}
