import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * App dùng một mình, không có đăng nhập — mọi request đều coi như của user
 * ADMIN duy nhất trong DB. `cache()` để nhiều lần gọi trong cùng 1 request
 * (layout + page) chỉ query DB một lần.
 */
export const getCurrentUser = cache(async () => {
  return prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
});
