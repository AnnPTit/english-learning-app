"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewAction } from "../../actions";
import type { Rating } from "@/lib/srs";

type CardData = {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
};

const RATING_BUTTONS: { rating: Rating; label: string; className: string }[] = [
  { rating: "forgot", label: "Quên", className: "bg-red-600" },
  { rating: "hard", label: "Khó", className: "bg-orange-500" },
  { rating: "easy", label: "Dễ", className: "bg-green-600" },
  { rating: "very_easy", label: "Rất dễ", className: "bg-blue-600" },
];

export function StudySession({
  deckId,
  deckName,
  initialCards,
}: {
  deckId: string;
  deckName: string;
  initialCards: CardData[];
}) {
  const [queue] = useState(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();

  const current = queue[index];

  function handleRate(rating: Rating) {
    if (!current) return;
    startTransition(async () => {
      await submitReviewAction(deckId, current.id, rating);
      setFlipped(false);
      setIndex((i) => i + 1);
    });
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">
          Xong rồi! Bạn đã ôn hết thẻ đến hạn hôm nay.
        </p>
        <Link href={`/decks/${deckId}`} className="underline">
          Quay lại deck
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-black/60">
        <Link href={`/decks/${deckId}`} className="underline">
          ← {deckName}
        </Link>
        <span>
          {index + 1}/{queue.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-black/10 p-6 text-center"
      >
        <p className="text-2xl font-semibold">{current.term}</p>
        {flipped ? (
          <>
            <p className="text-lg text-black/70">{current.meaning}</p>
            {current.example && (
              <p className="text-sm italic text-black/40">{current.example}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-black/40">Chạm để xem nghĩa</p>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-2 gap-2">
          {RATING_BUTTONS.map((b) => (
            <button
              key={b.rating}
              type="button"
              disabled={isPending}
              onClick={() => handleRate(b.rating)}
              className={`rounded-lg py-3 text-white disabled:opacity-50 ${b.className}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
