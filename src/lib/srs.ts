/**
 * Thuật toán SM-2 (SuperMemo 2) để tính lịch ôn tập spaced repetition.
 * Tham khảo: https://super-memory.com/english/ol/sm2.htm
 */

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type SrsState = {
  repetition: number;
  easeFactor: number;
  interval: number;
};

const MIN_EASE_FACTOR = 1.3;

export function reviewCard(prev: SrsState, quality: Quality): SrsState {
  let { repetition, easeFactor, interval } = prev;

  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;

    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    easeFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < MIN_EASE_FACTOR) {
      easeFactor = MIN_EASE_FACTOR;
    }
  }

  return { repetition, easeFactor, interval };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Ánh xạ 4 nút đánh giá trên UI sang quality score của SM-2 (thang 0-5). */
export const RATING_TO_QUALITY = {
  forgot: 0,
  hard: 3,
  easy: 4,
  very_easy: 5,
} as const satisfies Record<string, Quality>;

export type Rating = keyof typeof RATING_TO_QUALITY;
