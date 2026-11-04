import type { Theme } from "../types";
import {
  hexToRgba,
  roundRectPath,
  setFont,
  truncateToWidth,
  withLetterSpacing,
  wrapWords,
  type Ctx,
} from "./helpers";

export interface HeaderOptions {
  width: number;
  padding: number;
  compact: boolean;
  theme: Theme;
  tournament: string;
  stage: string;
  dateText: string;
  timezone: string;
}

interface TitleLayout {
  lines: string[];
  size: number;
}

function layoutTitle(ctx: Ctx, text: string, maxWidth: number, compact: boolean): TitleLayout {
  // Сначала пробуем уместить в одну строку крупным шрифтом.
  for (let size = compact ? 76 : 92; size >= 60; size -= 4) {
    setFont(ctx, 900, size);
    if (ctx.measureText(text).width <= maxWidth) return { lines: [text], size };
  }
  // Иначе — в две строки.
  for (let size = compact ? 72 : 84; size >= 40; size -= 4) {
    setFont(ctx, 900, size);
    const lines = wrapWords(ctx, text, maxWidth);
    if (lines.length <= 2 && lines.every((line) => ctx.measureText(line).width <= maxWidth)) {
      return { lines, size };
    }
  }
  setFont(ctx, 900, 40);
  const lines = wrapWords(ctx, text, maxWidth)
    .slice(0, 2)
    .map((line) => truncateToWidth(ctx, line, maxWidth));
  return { lines, size: 40 };
}

/** Рисует шапку и возвращает Y-координату её нижнего края. */
export function drawHeader(ctx: Ctx, options: HeaderOptions): number {
  const { width, padding, compact, theme } = options;
  const maxWidth = width - padding * 2;
  let y = padding;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Надпись над заголовком
  setFont(ctx, 800, 26);
  ctx.fillStyle = theme.accent;
  withLetterSpacing(ctx, 8, () => ctx.fillText("РАСПИСАНИЕ МАТЧЕЙ", padding, y));
  y += 26 + (compact ? 22 : 34);

  // Название турнира
  const title = (options.tournament.trim() || "Название турнира").toUpperCase();
  const layout = layoutTitle(ctx, title, maxWidth, compact);
  const lineHeight = layout.size * 1.08;
  setFont(ctx, 900, layout.size);
  ctx.fillStyle = "#ffffff";
  layout.lines.forEach((line, index) => ctx.fillText(line, padding, y + index * lineHeight));
  y += layout.lines.length * lineHeight + (compact ? 10 : 16);

  // Стадия турнира
  const stage = options.stage.trim();
  if (stage) {
    const stageSize = compact ? 30 : 36;
    setFont(ctx, 700, stageSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(truncateToWidth(ctx, stage, maxWidth), padding, y);
    y += stageSize + (compact ? 18 : 26);
  }

  // Плашка с датой и часовым поясом
  const pillText = [options.dateText.toUpperCase(), options.timezone.trim()].filter(Boolean).join("  •  ");
  if (pillText) {
    setFont(ctx, 800, 28);
    const pillWidth = Math.min(maxWidth, ctx.measureText(pillText).width + 52);
    const pillHeight = 56;
    roundRectPath(ctx, padding, y, pillWidth, pillHeight, pillHeight / 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.fillStyle = theme.onAccent;
    ctx.textBaseline = "middle";
    ctx.fillText(truncateToWidth(ctx, pillText, pillWidth - 52), padding + 26, y + pillHeight / 2 + 1);
    ctx.textBaseline = "top";
    y += pillHeight;
  } else {
    // Тонкая линия, если плашки нет
    ctx.fillStyle = hexToRgba(theme.accent, 0.6);
    ctx.fillRect(padding, y, 120, 4);
    y += 4;
  }

  return y;
}
