import type { Theme } from "../types";
import { fitFontSize, setFont, truncateToWidth, type Ctx } from "./helpers";

const FOOTER_WITH_CHANNEL = 120;
const FOOTER_EMPTY = 30;

export function footerHeight(channel: string): number {
  return channel.trim() ? FOOTER_WITH_CHANNEL : FOOTER_EMPTY;
}

export function drawFooter(
  ctx: Ctx,
  options: { width: number; height: number; padding: number; theme: Theme; channel: string },
): void {
  const channel = options.channel.trim();
  if (!channel) return;

  const { width, height, padding, theme } = options;
  const maxWidth = width - padding * 2 - 60;
  const top = height - FOOTER_WITH_CHANNEL;

  // Линия-разделитель
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fillRect(padding, top + 8, width - padding * 2, 2);

  // Название канала с точкой
  const size = fitFontSize(ctx, channel, 800, maxWidth, 34, 20);
  setFont(ctx, 800, size);
  const text = truncateToWidth(ctx, channel, maxWidth);
  const textWidth = ctx.measureText(text).width;
  const midY = top + 8 + (FOOTER_WITH_CHANNEL - 8 - 24) / 2;
  const startX = width / 2 - (textWidth + 28) / 2;

  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(startX + 7, midY, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillText(text, startX + 28, midY + 1);
}
