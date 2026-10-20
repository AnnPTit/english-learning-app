"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  return session.user.id;
}

export async function createTodo(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.todo.create({ data: { userId, title } });
  revalidatePath("/todos");
}

export async function toggleTodo(todoId: string) {
  const userId = await requireUserId();
  const todo = await prisma.todo.findUniqueOrThrow({ where: { id: todoId } });
  if (todo.userId !== userId) throw new Error("Không có quyền sửa việc này");

  await prisma.todo.update({
    where: { id: todoId },
    data: { completed: !todo.completed },
  });
  revalidatePath("/todos");
}

export async function deleteTodo(todoId: string) {
  const userId = await requireUserId();
  const todo = await prisma.todo.findUniqueOrThrow({ where: { id: todoId } });
  if (todo.userId !== userId) throw new Error("Không có quyền xóa việc này");

  await prisma.todo.delete({ where: { id: todoId } });
  revalidatePath("/todos");
}
