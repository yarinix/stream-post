import type { RenderLogo } from "../logos/types";
import type { Theme } from "../types";
import { hexToRgba, roundRectPath, setFont, type Ctx } from "./helpers";

export const POSTER_PADDING = 64;
/** Наклон заголовка: эмулируем жирный italic без загрузки отдельного начертания шрифта. */
export const POSTER_SKEW = 0.14;

export type PillState = "normal" | "win" | "lose" | "accent";

/** SVG-контур «бумажного самолётика» Telegram (simple-icons, viewBox 0 0 24 24). */
const TELEGRAM_PLANE_PATH =
  "M23.91 3.79L20.3 20.84c-.25 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.56-1.13.56l.4-5.67 10.32-9.33c.45-.4-.1-.62-.7-.22L6.02 13.06l-5.5-1.72c-1.2-.37-1.22-1.2.25-1.78L22.13 2.4c.98-.37 1.84.23 1.78 1.39z";

/** Ширина наклонённой строки с небольшим запасом на сдвиг нижней части букв. */
export function measureSkewed(ctx: Ctx, text: string, weight: number, size: number): number {
  setFont(ctx, weight, size);
  return ctx.measureText(text).width + size * POSTER_SKEW;
}

/**
 * Рисует жирную наклонную строку. y — верх текста.
 * Сдвиг подобран так, что визуальный центр строки совпадает с x: верх уходит
 * вправо на половину сдвига, низ — влево. Так шапка «не уезжает» относительно
 * надписи над ней и подзаголовка.
 */
export function drawSkewedText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  align: "left" | "center" = "left",
): void {
  ctx.save();
  ctx.translate(x, y);
  // x' = x - k * (y_local - size / 2)
  ctx.transform(1, 0, -POSTER_SKEW, 1, (POSTER_SKEW * size) / 2, 0);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  setFont(ctx, weight, size);
  ctx.fillStyle = color;
  const width = ctx.measureText(text).width;
  ctx.fillText(text, align === "center" ? -width / 2 : 0, 0);
  ctx.restore();
}

/** Полупрозрачная карточка с тонкой обводкой и акцентной полосой слева. */
export function drawPosterCard(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  theme: Theme,
): void {
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = theme.accent;
  ctx.fillRect(x, y, 8, h);
  ctx.restore();
}

/** Логотип без подложки: эмблема лежит прямо в круглом слоте карточки. */
export function drawPosterLogo(ctx: Ctx, logo: RenderLogo, x: number, y: number, size: number): void {
  const image = logo.image;
  const iw = Math.max(1, image.width);
  const ih = Math.max(1, image.height);
  const scale = Math.min(size / iw, size / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h);
}

/**
 * Круглый слот под логотип. Рисуется всегда — даже если эмблемы нет, — поэтому
 * левая и правая зоны карточки имеют одинаковую геометрию при любых данных.
 */
export function drawPosterLogoSlot(
  ctx: Ctx,
  cx: number,
  cy: number,
  size: number,
  theme: Theme,
  state: "normal" | "win" | "lose",
  logo: RenderLogo | null,
): void {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fill();
  ctx.lineWidth = state === "win" ? Math.max(2, size * 0.045) : 1.5;
  ctx.strokeStyle = state === "win" ? hexToRgba(theme.accent, 0.95) : "rgba(255, 255, 255, 0.14)";
  ctx.stroke();
  ctx.restore();

  if (state === "lose") ctx.globalAlpha = 0.55;
  if (logo) drawPosterLogo(ctx, logo, cx - r, cy - r, size);
  ctx.globalAlpha = 1;
}

/** Таблетка с числом: коэффициент, цифра счёта или акцентный бейдж счёта. */
export function drawPosterPill(
  ctx: Ctx,
  cx: number,
  cy: number,
  w: number,
  h: number,
  text: string,
  theme: Theme,
  state: PillState = "normal",
): void {
  const solid = state === "accent";
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = solid
    ? theme.accent
    : state === "win"
      ? hexToRgba(theme.accent, 0.18)
      : "rgba(255, 255, 255, 0.02)";
  ctx.fill();
  if (!solid) {
    ctx.strokeStyle = hexToRgba(theme.accent, state === "win" ? 0.95 : state === "lose" ? 0.35 : 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  setFont(ctx, 800, Math.min(h * 0.52, 40));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = solid
    ? theme.onAccent
    : state === "win"
      ? theme.accent
      : state === "lose"
        ? "rgba(255, 255, 255, 0.5)"
        : "#ffffff";
  ctx.fillText(text, cx, cy + 1);
}

/** Иконка комментария в акцентной рамке (футер «Предиктов»). */
export function drawChatIcon(ctx: Ctx, x: number, y: number, size: number, theme: Theme): void {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, size * 0.22);
  ctx.strokeStyle = hexToRgba(theme.accent, 0.8);
  ctx.lineWidth = 2;
  ctx.stroke();

  const bx = x + size * 0.2;
  const by = y + size * 0.28;
  const bw = size * 0.6;
  const bh = size * 0.4;
  roundRectPath(ctx, bx, by, bw, bh, size * 0.1);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.2, by + bh - 1);
  ctx.lineTo(bx + bw * 0.16, by + bh + size * 0.12);
  ctx.lineTo(bx + bw * 0.4, by + bh - 1);
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(bx + bw * (0.3 + i * 0.2), by + bh * 0.5, size * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Логотип Telegram: фирменный синий круг + белый SVG-контур самолётика.
 * Контур задан настоящим SVG path и рисуется через Path2D, а не набором
 * прямоугольников, поэтому иконка остаётся узнаваемой при любом размере.
 */
export function drawTelegramIcon(
  ctx: Ctx,
  x: number,
  y: number,
  size: number,
  circleColor = "#2AABEE",
): void {
  ctx.save();
  const r = size / 2;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = circleColor;
  ctx.fill();

  const inset = size * 0.19;
  const scale = (size - inset * 2) / 24;
  ctx.translate(x + inset, y + inset);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fill(new Path2D(TELEGRAM_PLANE_PATH));
  ctx.restore();
}
