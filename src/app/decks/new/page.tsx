import Link from "next/link";
import { createDeck } from "../actions";

export default function NewDeckPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 p-4">
      <Link href="/" className="text-sm underline">
        ← Quay lại
      </Link>
      <h1 className="text-xl font-semibold">Tạo deck mới</h1>
      <form action={createDeck} className="space-y-2">
        <input
          name="name"
          placeholder="Tên deck, ví dụ: Từ vựng cơ bản"
          required
          className="w-full rounded border border-black/20 px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-black py-2 text-white"
        >
          Tạo deck
        </button>
      </form>
    </main>
  );
}
