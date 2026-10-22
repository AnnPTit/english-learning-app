"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ear,
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  PartyPopper,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { SpeakButton, speak } from "@/components/speak-button";

type CardData = { id: string; term: string; meaning: string };
type Mode = "listen" | "meaning";

const MODES: {
  mode: Mode;
  title: string;
  description: string;
  icon: typeof Ear;
}[] = [
  {
    mode: "listen",
    title: "Nghe điền từ",
    description: "Nghe phát âm rồi gõ lại đúng từ tiếng Anh",
    icon: Ear,
  },
  {
    mode: "meaning",
    title: "Nhìn nghĩa điền từ",
    description: "Xem nghĩa tiếng Việt rồi gõ từ tiếng Anh tương ứng",
    icon: BookOpenCheck,
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function QuizSession({
  deckId,
  deckName,
  cards,
}: {
  deckId: string;
  deckName: string;
  cards: CardData[];
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [queue, setQueue] = useState<CardData[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[index];

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, mode]);

  useEffect(() => {
    if (mode === "listen" && current && checked === null) {
      speak(current.term);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, current?.id]);

  function start(selectedMode: Mode) {
    setMode(selectedMode);
    setQueue(shuffle(cards));
    setIndex(0);
    setInput("");
    setChecked(null);
    setCorrectCount(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;

    if (checked !== null) {
      setIndex((i) => i + 1);
      setInput("");
      setChecked(null);
      return;
    }

    const isCorrect = normalize(input) === normalize(current.term);
    if (isCorrect) setCorrectCount((c) => c + 1);
    setChecked(isCorrect);
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Inbox className="size-7 text-foreground/25" />
        <p className="text-sm text-foreground/50">
          Deck chưa có từ nào để luyện tập.
        </p>
        <Link href={`/decks/${deckId}`} className="underline">
          Quay lại deck
        </Link>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        <Link
          href={`/decks/${deckId}`}
          className="flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="size-4" />
          {deckName}
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            Chọn dạng bài
          </h1>
          <p className="text-sm text-foreground/50">
            {cards.length} từ trong deck này.
          </p>
        </div>
        <div className="space-y-3">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => start(m.mode)}
              className="flex w-full items-center gap-3 rounded-2xl border border-indigo-950/5 bg-white p-4 text-left shadow-sm shadow-indigo-950/5 transition-colors hover:bg-indigo-50/40"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-brand-dark">
                <m.icon className="size-5" />
              </span>
              <span>
                <span className="block font-medium text-foreground">
                  {m.title}
                </span>
                <span className="block text-sm text-foreground/50">
                  {m.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!current) {
    const percent = Math.round((correctCount / queue.length) * 100);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-indigo-100 text-brand-dark">
          <PartyPopper className="size-8" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Xong rồi!</p>
          <p className="text-sm text-foreground/50">
            Bạn đúng {correctCount}/{queue.length} câu ({percent}%).
          </p>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => start(mode)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-indigo-100"
          >
            <RotateCcw className="size-4" />
            Làm lại
          </button>
          <Link
            href={`/decks/${deckId}`}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
          >
            Quay lại deck
          </Link>
        </div>
      </div>
    );
  }

  const progress = (index / queue.length) * 100;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="flex items-center gap-1 text-foreground/50 transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="size-4" />
            {deckName}
          </button>
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

      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-indigo-950/5 bg-white p-6 text-center shadow-sm shadow-indigo-950/5">
        {mode === "listen" ? (
          <>
            <p className="text-xs text-foreground/35">
              Nghe và gõ từ bạn nghe được
            </p>
            <SpeakButton
              text={current.term}
              size="size-7"
              className="flex size-16 items-center justify-center rounded-3xl bg-indigo-100 text-brand-dark transition-colors hover:bg-indigo-200"
            />
          </>
        ) : (
          <>
            <p className="text-xs text-foreground/35">
              Gõ từ tiếng Anh tương ứng
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {current.meaning}
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={checked !== null}
          placeholder="Gõ câu trả lời..."
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-xl border px-3.5 py-3 text-center text-base outline-none transition-shadow focus:ring-2 ${
            checked === null
              ? "border-indigo-950/10 bg-white focus:border-brand focus:ring-brand/20"
              : checked
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-200"
                : "border-red-300 bg-red-50 text-red-700 focus:ring-red-200"
          }`}
        />

        {checked !== null && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              checked
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {checked ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <XCircle className="size-4 shrink-0" />
            )}
            {checked ? "Chính xác!" : `Chưa đúng. Đáp án: ${current.term}`}
          </div>
        )}

        <button
          type="submit"
          disabled={checked === null && input.trim() === ""}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {checked === null ? "Kiểm tra" : "Tiếp theo"}
        </button>
      </form>
    </div>
  );
}
