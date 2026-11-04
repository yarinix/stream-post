import { MAX_SCORE } from "./constants";
import type { Match, PostMode } from "./types";

export interface Score {
  a: number;
  b: number;
}

export type ScoreSide = "a" | "b";

type ScoreMode = Exclude<PostMode, "schedule">;

const FIELDS: Record<ScoreMode, { a: keyof Match; b: keyof Match }> = {
  predict: { a: "predictA", b: "predictB" },
  results: { a: "resultA", b: "resultB" },
};

/** Приводит ввод к целому числу 0..MAX_SCORE. Пустая строка и мусор → null. */
export function clampScore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const rounded = Math.round(raw);
  if (rounded < 0 || rounded > MAX_SCORE) return null;
  return rounded;
}

/** Возвращает пару полей матча для режима со счётом. Для расписания — null. */
export function scoreFields(mode: PostMode): { a: keyof Match; b: keyof Match } | null {
  return mode === "schedule" ? null : FIELDS[mode];
}

/** Полный счёт (обе стороны заполнены) или null — тогда в центре строки показывается заглушка. */
export function getScore(match: Match, mode: PostMode): Score | null {
  const fields = scoreFields(mode);
  if (!fields) return null;
  const a = clampScore(match[fields.a]);
  const b = clampScore(match[fields.b]);
  return a === null || b === null ? null : { a, b };
}

export function setScore(match: Match, mode: PostMode, side: ScoreSide, value: unknown): Match {
  const fields = scoreFields(mode);
  if (!fields) return match;
  const key = side === "a" ? fields.a : fields.b;
  return { ...match, [key]: clampScore(value) };
}

export function formatScore(score: Score): string {
  return `${score.a} : ${score.b}`;
}

/**
 * Текст центральной колонки карточки матча на картинке.
 * Расписание — «VS»; незаполненный прогноз — «? : ?»; несыгранный матч в итогах — «— : —».
 */
export function scoreCenterText(match: Match, mode: PostMode): string {
  if (mode === "schedule") return "VS";
  const score = getScore(match, mode);
  if (score) return formatScore(score);
  return mode === "predict" ? "? : ?" : "— : —";
}

/** Кто победил по финальному счёту. null — ничья, счёт не заполнен или режим без результатов. */
export function winnerSide(match: Match, mode: PostMode): ScoreSide | null {
  if (mode !== "results") return null;
  const score = getScore(match, mode);
  if (!score || score.a === score.b) return null;
  return score.a > score.b ? "a" : "b";
}
