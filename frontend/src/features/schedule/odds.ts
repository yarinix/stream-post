import type { Match, PostMode } from "./types";

export type OddsSide = "a" | "b";

const FIELDS: Record<OddsSide, keyof Match> = { a: "oddsA", b: "oddsB" };

/**
 * Мягкая нормализация ввода коэффициента: оставляем цифры и одну точку,
 * чтобы пользователь мог набирать «1» → «1.» → «1.48» без «отпрыгивания» поля.
 * Запятая превращается в точку, мусор отбрасывается.
 */
export function sanitizeOdds(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).trim().replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = digits.split(".");
  // Оставляем только первую точку: «1.4.8» → «1.48».
  const cleaned = (parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : digits).slice(0, 7);
  return cleaned || null;
}

/** Показывать ли поля коэффициентов: они нужны только в режиме «Предикты». */
export function oddsFields(mode: PostMode): { a: keyof Match; b: keyof Match } | null {
  return mode === "predict" ? FIELDS : null;
}

export function getOdds(match: Match, side: OddsSide): string | null {
  return sanitizeOdds(match[FIELDS[side]]);
}

export function setOdds(match: Match, side: OddsSide, value: unknown): Match {
  return { ...match, [FIELDS[side]]: sanitizeOdds(value) };
}

/** Текст плашки на картинке. Незаполненное значение и «голая» точка → прочерк. */
export function oddsText(match: Match, side: OddsSide): string {
  const value = getOdds(match, side);
  if (!value || !/[0-9]/.test(value)) return "—";
  return value;
}
