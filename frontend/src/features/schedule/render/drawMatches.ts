import type { Match, Theme } from "../types";
import {
  fitFontSize,
  hexToRgba,
  roundRectPath,
  setFont,
  truncateToWidth,
  type Ctx,
  type Region,
} from "./helpers";

const MAX_ROW_HEIGHT = 170;
const MIN_ROW_HEIGHT = 40;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function drawPlaceholder(ctx: Ctx, region: Region): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 700, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillText("Добавьте матчи", region.x + region.w / 2, region.y + region.h / 2);
}

function drawRow(ctx: Ctx, match: Match, x: number, y: number, w: number, h: number, theme: Theme): void {
  const radius = Math.min(22, h * 0.2);

  // Карточка
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = "rgba(255, 255, 255, 0.065)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Акцентная полоса слева
  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = theme.accent;
  ctx.fillRect(x, y, 8, h);
  ctx.restore();

  const midY = y + h / 2;
  ctx.textBaseline = "middle";

  // Время
  const timeColumn = Math.min(220, w * 0.2);
  const timeText = match.time.trim() || "--:--";
  const timeSize = fitFontSize(ctx, timeText, 900, timeColumn - 36, Math.min(66, h * 0.46), 18);
  setFont(ctx, 900, timeSize);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(timeText, x + 4 + timeColumn / 2, midY + 1);

  // Разделитель
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fillRect(x + timeColumn + 4, y + h * 0.22, 2, h * 0.56);

  // Формат (BO3 и т.п.)
  const badgeHeight = Math.min(46, h * 0.4);
  const badgeFont = badgeHeight * 0.55;
  setFont(ctx, 800, badgeFont);
  const badgeWidth = ctx.measureText(match.format).width + badgeHeight * 1.0;
  const badgeX = x + w - 28 - badgeWidth;
  roundRectPath(ctx, badgeX, midY - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fillStyle = hexToRgba(theme.accent, 0.18);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(theme.accent, 0.8);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "center";
  ctx.fillText(match.format, badgeX + badgeWidth / 2, midY + 1);

  // Команды
  const teamsLeft = x + timeColumn + 4 + 30;
  const teamsRight = badgeX - 24;
  const centerX = (teamsLeft + teamsRight) / 2;
  const teamA = (match.teamA.trim() || "TBD").toUpperCase();
  const teamB = (match.teamB.trim() || "TBD").toUpperCase();

  const maxNameSize = Math.min(46, h * 0.34);
  const provisionalVs = Math.max(maxNameSize * 0.55, 14);
  setFont(ctx, 800, provisionalVs);
  const vsHalf = ctx.measureText("VS").width / 2 + 22;
  const maxSide = Math.max(40, (teamsRight - teamsLeft) / 2 - vsHalf);

  const symmetricSize = Math.min(
    fitFontSize(ctx, teamA, 800, maxSide, maxNameSize, 16),
    fitFontSize(ctx, teamB, 800, maxSide, maxNameSize, 16),
  );

  let nameSize = symmetricSize;
  let teamAEnd = centerX - vsHalf; // правый край названия первой команды
  let teamBStart = centerX + vsHalf; // левый край названия второй команды
  let vsX = centerX;
  let textA = teamA;
  let textB = teamB;

  if (symmetricSize < Math.min(28, maxNameSize * 0.75)) {
    // Одно из названий длинное: не сжимаем обе команды, а делим место по их длине.
    const available = teamsRight - teamsLeft - vsHalf * 2;
    const minSize = 22;
    nameSize = Math.min(maxNameSize, symmetricSize * 2);
    while (nameSize > minSize) {
      setFont(ctx, 800, nameSize);
      if (ctx.measureText(teamA).width + ctx.measureText(teamB).width <= available) break;
      nameSize -= 2;
    }
    nameSize = Math.max(nameSize, minSize);
    setFont(ctx, 800, nameSize);

    let widthA = ctx.measureText(teamA).width;
    let widthB = ctx.measureText(teamB).width;
    if (widthA + widthB > available) {
      // Даже на минимальном размере не влезает: обрезаем более длинное название.
      const half = available / 2;
      if (widthA > half && widthB > half) {
        textA = truncateToWidth(ctx, teamA, half);
        textB = truncateToWidth(ctx, teamB, half);
      } else if (widthA > widthB) {
        textA = truncateToWidth(ctx, teamA, available - widthB);
      } else {
        textB = truncateToWidth(ctx, teamB, available - widthA);
      }
      widthA = ctx.measureText(textA).width;
      widthB = ctx.measureText(textB).width;
    }

    const startX = teamsLeft + (teamsRight - teamsLeft - (widthA + widthB + vsHalf * 2)) / 2;
    teamAEnd = startX + widthA;
    vsX = teamAEnd + vsHalf;
    teamBStart = vsX + vsHalf;
  } else {
    setFont(ctx, 800, nameSize);
    textA = truncateToWidth(ctx, teamA, maxSide);
    textB = truncateToWidth(ctx, teamB, maxSide);
  }

  setFont(ctx, 800, nameSize);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(textA, teamAEnd, midY + 1);
  ctx.textAlign = "left";
  ctx.fillText(textB, teamBStart, midY + 1);

  setFont(ctx, 800, Math.max(nameSize * 0.55, 14));
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillText("VS", vsX, midY + 1);
}

/** Рисует список матчей в заданной области. Размеры строк подстраиваются под количество матчей. */
export function drawMatches(ctx: Ctx, matches: Match[], region: Region, theme: Theme): void {
  const count = matches.length;
  if (count === 0) {
    drawPlaceholder(ctx, region);
    return;
  }

  const gap = count > 5 ? 12 : 18;
  const rowHeight = clamp((region.h - gap * (count - 1)) / count, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
  const totalHeight = rowHeight * count + gap * (count - 1);
  // Блок чуть выше центра: так он ближе к шапке и не «проваливается» вниз.
  const startY = region.y + Math.max(0, (region.h - totalHeight) * 0.4);

  matches.forEach((match, index) => {
    drawRow(ctx, match, region.x, startY + index * (rowHeight + gap), region.w, rowHeight, theme);
  });
}
