"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpenText, Mail, Lock, ArrowRight, TriangleAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email hoặc mật khẩu không đúng");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-violet-200/40 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-white bg-white/90 p-7 shadow-xl shadow-indigo-950/5 backdrop-blur"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-indigo-300">
            <BookOpenText className="size-6" strokeWidth={2.25} />
          </span>
          <h1 className="text-lg font-semibold text-foreground">
            Học Tiếng Anh
          </h1>
          <p className="text-sm text-foreground/50">
            Đăng nhập để tiếp tục học tập
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground/60"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/30" />
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-indigo-950/10 bg-white py-2.5 pr-3 pl-10 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground/60"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/30" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-indigo-950/10 bg-white py-2.5 pr-3 pl-10 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          {!loading && <ArrowRight className="size-4" />}
        </button>
      </form>
    </div>
  );
}
