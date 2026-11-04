import { FONT_FAMILY } from "../fonts";

export type Ctx = CanvasRenderingContext2D;

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function setFont(ctx: Ctx, weight: number, size: number): void {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT_FAMILY}`;
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Подбирает наибольший размер шрифта (от maxSize вниз до minSize), при котором текст влезает в maxWidth. */
export function fitFontSize(
  ctx: Ctx,
  text: string,
  weight: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): number {
  let size = Math.max(maxSize, minSize);
  while (size > minSize) {
    setFont(ctx, weight, size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

/** Обрезает текст с «…», если он не влезает в maxWidth при текущем шрифте. */
export function truncateToWidth(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}…`;
}

/** Жадный перенос по словам при текущем шрифте. */
export function wrapWords(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type SpacedCtx = Ctx & { letterSpacing?: string };

/** Выполняет отрисовку с межбуквенным интервалом (если браузер поддерживает). */
export function withLetterSpacing(ctx: Ctx, px: number, draw: () => void): void {
  const spaced = ctx as SpacedCtx;
  const supported = "letterSpacing" in spaced;
  const previous = supported ? spaced.letterSpacing : undefined;
  if (supported) spaced.letterSpacing = `${px}px`;
  draw();
  if (supported) spaced.letterSpacing = previous ?? "0px";
}
