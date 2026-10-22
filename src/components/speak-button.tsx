"use client";

import { Volume2 } from "lucide-react";

/**
 * Phát âm bằng Web Speech API có sẵn trong trình duyệt (kể cả Safari iOS),
 * không cần dịch vụ TTS bên ngoài hay API key.
 */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function SpeakButton({
  text,
  className,
  size = "size-4",
}: {
  text: string;
  className?: string;
  size?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`Phát âm "${text}"`}
      className={
        className ??
        "flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-indigo-50 hover:text-brand-dark"
      }
    >
      <Volume2 className={size} />
    </button>
  );
}
