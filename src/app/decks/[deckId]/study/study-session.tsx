"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PartyPopper,
  X,
  Frown,
  Smile,
  Sparkle,
} from "lucide-react";
import { submitReviewAction } from "../../actions";
import { SpeakButton } from "@/components/speak-button";
import type { Rating } from "@/lib/srs";

type CardData = {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
};

const RATING_BUTTONS: {
  rating: Rating;
  label: string;
  icon: typeof X;
  className: string;
}[] = [
  {
    rating: "forgot",
    label: "Quên",
    icon: X,
    className: "bg-red-50 text-red-600 hover:bg-red-100",
  },
  {
    rating: "hard",
    label: "Khó",
    icon: Frown,
    className: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  },
  {
    rating: "easy",
    label: "Dễ",
    icon: Smile,
    className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  },
  {
    rating: "very_easy",
    label: "Rất dễ",
    icon: Sparkle,
    className: "bg-indigo-50 text-brand-dark hover:bg-indigo-100",
  },
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
  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0;

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
        <span className="flex size-16 items-center justify-center rounded-3xl bg-indigo-100 text-brand-dark">
          <PartyPopper className="size-8" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Xong rồi!</p>
          <p className="text-sm text-foreground/50">
            Bạn đã ôn hết thẻ đến hạn hôm nay.
          </p>
        </div>
        <Link
          href={`/decks/${deckId}`}
          className="mt-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
        >
          Quay lại deck
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/decks/${deckId}`}
            className="flex items-center gap-1 text-foreground/50 transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="size-4" />
            {deckName}
          </Link>
          <span className="font-medium text-foreground/50">
            {index + 1}/{queue.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-950/5">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div style={{ perspective: "1200px" }} className="relative flex flex-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          className="relative w-full flex-1 cursor-pointer"
        >
          <div
            className={`flip-card-inner relative h-full min-h-56 w-full ${flipped ? "is-flipped" : ""}`}
          >
            <div className="flip-card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-indigo-950/5 bg-white p-6 text-center shadow-sm shadow-indigo-950/5">
              <p className="text-2xl font-semibold text-foreground">
                {current.term}
              </p>
              <p className="text-xs text-foreground/35">
                Chạm để xem nghĩa
              </p>
            </div>

            <div className="flip-card-face flip-card-back absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-brand p-6 text-center text-white shadow-md shadow-indigo-300">
              <p className="text-lg font-semibold">{current.meaning}</p>
              {current.example && (
                <p className="text-sm text-indigo-100 italic">
                  {current.example}
                </p>
              )}
            </div>
          </div>
        </div>

        {!flipped && (
          <SpeakButton
            text={current.term}
            size="size-5"
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-indigo-50 text-brand-dark transition-colors hover:bg-indigo-100"
          />
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map((b) => (
            <button
              key={b.rating}
              type="button"
              disabled={isPending}
              onClick={() => handleRate(b.rating)}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition-colors disabled:opacity-50 ${b.className}`}
            >
              <b.icon className="size-4.5" />
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
