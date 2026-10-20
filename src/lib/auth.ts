import { timingSafeEqual } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 180 }, // 180 ngày, đỡ phải đăng nhập lại
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      id: "access-key",
      name: "Access key",
      credentials: {
        key: { label: "Access key", type: "password" },
      },
      async authorize(credentials) {
        const accessKey = process.env.ACCESS_KEY;
        if (!accessKey || !credentials?.key) return null;
        if (!safeEqual(credentials.key, accessKey)) return null;

        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (!admin) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MEMBER";
      }
      return session;
    },
  },
};
