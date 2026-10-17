import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { createDeck } from "../actions";

export default function NewDeckPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-5 p-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-brand-dark"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </Link>

      <div className="rounded-2xl border border-indigo-950/5 bg-white p-6 shadow-sm shadow-indigo-950/5">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-brand-dark">
            <Layers className="size-5.5" />
          </span>
          <h1 className="text-lg font-semibold text-foreground">
            Tạo deck mới
          </h1>
          <p className="text-sm text-foreground/50">
            Đặt tên cho bộ từ vựng bạn muốn học
          </p>
        </div>

        <form action={createDeck} className="space-y-3">
          <input
            name="name"
            placeholder="Ví dụ: Từ vựng cơ bản"
            required
            autoFocus
            className="w-full rounded-xl border border-indigo-950/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
          >
            Tạo deck
          </button>
        </form>
      </div>
    </main>
  );
}
