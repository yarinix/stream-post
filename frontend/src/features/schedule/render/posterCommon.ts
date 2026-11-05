import type { RenderLogo } from "../logos/types";
import type { Theme } from "../types";
import { hexToRgba, roundRectPath, setFont, type Ctx } from "./helpers";

export const POSTER_PADDING = 64;
/** Наклон заголовка: эмулируем жирный italic без загрузки отдельного начертания шрифта. */
export const POSTER_SKEW = 0.14;

export type PillState = "normal" | "win" | "lose";

/** Ширина наклонённой строки с небольшим запасом на сдвиг нижней части букв. */
export function measureSkewed(ctx: Ctx, text: string, weight: number, size: number): number {
  setFont(ctx, weight, size);
  return ctx.measureText(text).width + size * POSTER_SKEW;
}

/** Рисует жирную наклонную строку. y — верх текста. */
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
  // x' = x - k * (y_local - size) → верх строки правее низа, как в italic.
  ctx.transform(1, 0, -POSTER_SKEW, 1, POSTER_SKEW * size, 0);
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

/** Логотип без подложки: на референсе эмблемы лежат прямо на фоне карточки. */
export function drawPosterLogo(ctx: Ctx, logo: RenderLogo, x: number, y: number, size: number): void {
  const image = logo.image;
  const iw = Math.max(1, image.width);
  const ih = Math.max(1, image.height);
  const scale = Math.min(size / iw, size / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h);
}

/** Таблетка с числом (коэффициент или цифра счёта). */
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
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = state === "win" ? hexToRgba(theme.accent, 0.18) : "rgba(255, 255, 255, 0.02)";
  ctx.fill();
  ctx.strokeStyle = hexToRgba(theme.accent, state === "win" ? 0.95 : state === "lose" ? 0.35 : 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();

  setFont(ctx, 800, Math.min(h * 0.52, 40));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle =
    state === "win" ? theme.accent : state === "lose" ? "rgba(255, 255, 255, 0.5)" : "#ffffff";
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

/** Упрощённый глиф Twitch: рамка и две вертикальные «полоски-глаза». */
export function drawTwitchIcon(ctx: Ctx, x: number, y: number, size: number, color: string): void {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, size * 0.18);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.stroke();

  ctx.fillStyle = color;
  const barW = size * 0.12;
  ctx.fillRect(x + size * 0.32, y + size * 0.22, barW, size * 0.46);
  ctx.fillRect(x + size * 0.56, y + size * 0.22, barW, size * 0.46);
  ctx.restore();
}
