import type { Theme } from "../types";
import { hexToRgba, roundRectPath, type Ctx } from "./helpers";

export function drawBackground(
  ctx: Ctx,
  width: number,
  height: number,
  theme: Theme,
  frameAlpha = 0.3,
): void {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, theme.bgTop);
  base.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // Свечение справа сверху
  const glowTop = ctx.createRadialGradient(width * 0.95, height * 0.02, 0, width * 0.95, height * 0.02, width * 0.95);
  glowTop.addColorStop(0, hexToRgba(theme.glow, 0.55));
  glowTop.addColorStop(1, hexToRgba(theme.glow, 0));
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  // Свечение слева снизу
  const glowBottom = ctx.createRadialGradient(0, height, 0, 0, height, width * 0.85);
  glowBottom.addColorStop(0, hexToRgba(theme.glow, 0.35));
  glowBottom.addColorStop(1, hexToRgba(theme.glow, 0));
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  // Диагональные линии
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 2;
  for (let x = -height; x < width + height; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.6, height);
    ctx.stroke();
  }
  ctx.restore();

  // Рамка
  ctx.save();
  roundRectPath(ctx, 24, 24, width - 48, height - 48, 28);
  ctx.strokeStyle = hexToRgba(theme.accent, frameAlpha);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
