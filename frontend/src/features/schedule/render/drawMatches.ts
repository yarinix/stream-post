import { findTeamLogo } from "../logos/types";
import type { RenderLogo } from "../logos/types";
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

const MAX_ROW_HEIGHT = 210;
const MIN_ROW_HEIGHT = 40;
const MAX_GAP = 44;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Базовый зазор между карточками: чем больше матчей, тем плотнее блок. */
function baseGap(count: number): number {
  if (count <= 2) return 24;
  if (count === 3) return 22;
  if (count === 4) return 18;
  if (count === 5) return 16;
  return 12;
}

export interface MatchesLayout {
  count: number;
  rowHeight: number;
  gap: number;
  startY: number;
  totalHeight: number;
}

/**
 * Раскладка блока матчей. Высота карточек и зазоры автоматически подстраиваются
 * под количество матчей (в первую очередь 3–5) и доступную высоту области:
 * при 3 матчах карточки крупнее и зазоры шире, при 5 — плотнее, но без наложений.
 */
export function computeMatchesLayout(count: number, region: Region): MatchesLayout {
  if (count === 0) {
    return { count: 0, rowHeight: 0, gap: 0, startY: region.y, totalHeight: 0 };
  }

  const available = Math.max(0, region.h);
  // Верхняя граница высоты карточки зависит от доступного места, а не фиксирована.
  const maxRow = Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, available * 0.27));
  const minRow = Math.min(MIN_ROW_HEIGHT, available / count);
  const gap0 = baseGap(count);
  const rowHeight = clamp((available - gap0 * (count - 1)) / count, minRow, maxRow);

  let gap = gap0;
  let totalHeight = rowHeight * count + gap * (count - 1);

  // Если карточки уперлись в максимум, избыток места уходит в зазоры —
  // так блок не «отлипает» от шапки и не оставляет пустую дыру снизу.
  if (count > 1 && available > totalHeight) {
    gap = Math.min(MAX_GAP, gap + (available - totalHeight) / (count - 1));
    totalHeight = rowHeight * count + gap * (count - 1);
  }

  // Симметричные поля сверху и снизу области — пространство между шапкой и матчами сбалансировано.
  const startY = region.y + Math.max(0, (available - totalHeight) / 2);
  return { count, rowHeight, gap, startY, totalHeight };
}

function drawPlaceholder(ctx: Ctx, region: Region): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(ctx, 700, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillText("Добавьте матчи", region.x + region.w / 2, region.y + region.h / 2);
}

/** Рисует логотип в квадрате с подложкой — чтобы PNG с прозрачным фоном читался на тёмной карточке. */
function drawLogo(ctx: Ctx, logo: RenderLogo, x: number, y: number, size: number): void {
  const radius = size * 0.22;
  const pad = size * 0.09;
  const inner = size - pad * 2;
  const { image } = logo;
  const imageWidth = Math.max(1, image.width);
  const imageHeight = Math.max(1, image.height);
  const scale = Math.min(inner / imageWidth, inner / imageHeight);
  const w = imageWidth * scale;
  const h = imageHeight * scale;

  ctx.save();
  roundRectPath(ctx, x, y, size, size, radius);
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fill();
  ctx.clip();
  ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, x, y, size, size, radius);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawRow(
  ctx: Ctx,
  match: Match,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  logos: RenderLogo[],
): void {
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
  const timeColumn = Math.min(200, w * 0.18);
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

  // Область команд
  const contentLeft = x + timeColumn + 4 + 22;
  const contentRight = badgeX - 14;
  const logoA = findTeamLogo(logos, match.teamA, match.logoA);
  const logoB = findTeamLogo(logos, match.teamB, match.logoB);
  const areaWidth = Math.max(0, contentRight - contentLeft);
  const teamA = (match.teamA.trim() || "TBD").toUpperCase();
  const teamB = (match.teamB.trim() || "TBD").toUpperCase();

  const logoSlots = (logoA ? 1 : 0) + (logoB ? 1 : 0);
  const logoGap = Math.max(8, h * 0.045);
  const maxLogoSize = Math.min(h * 0.54, 92, areaWidth * 0.2);
  const minLogoSize = Math.max(18, Math.min(maxLogoSize * 0.55, h * 0.3));
  const maxNameSize = Math.min(46, h * 0.34);
  const minNameSize = Math.max(22, Math.min(26, h * 0.19));

  // Логотип и названия делят одну ширину, поэтому подбираем их вместе:
  // логотип остаётся крупным, а названия — читаемыми.
  const measureNames = (size: number): number => {
    setFont(ctx, 800, size);
    const names = ctx.measureText(teamA).width + ctx.measureText(teamB).width;
    setFont(ctx, 800, Math.max(size * 0.55, 14));
    return names + ctx.measureText("VS").width + 22;
  };

  let logoSize = maxLogoSize;
  let preferredNameSize = maxNameSize;
  for (;;) {
    const textWidth = Math.max(0, areaWidth - logoSlots * (logoSize + logoGap));
    let candidate = maxNameSize;
    while (candidate > minNameSize && measureNames(candidate) > textWidth) {
      candidate -= 2;
    }
    // Проверяем именно минимальный размер: если названия влезают даже с ним —
    // логотип можно оставить крупным.
    const fitsAtMin = measureNames(minNameSize) <= textWidth;
    preferredNameSize = fitsAtMin ? candidate : minNameSize;
    if (logoSlots === 0 || fitsAtMin || logoSize <= minLogoSize) break;
    logoSize = Math.max(minLogoSize, logoSize - 4);
  }

  let textLeft = contentLeft;
  let textRight = contentRight;

  const applyLogoSpace = () => {
    textLeft = contentLeft;
    textRight = contentRight;
    if (logoA && logoSize > 12) textLeft += logoSize + logoGap;
    if (logoB && logoSize > 12) textRight -= logoSize + logoGap;
  };

  applyLogoSpace();

  if (logoA && logoSize > 12) {
    drawLogo(ctx, logoA, contentLeft, midY - logoSize / 2, logoSize);
  }
  if (logoB && logoSize > 12) {
    drawLogo(ctx, logoB, contentRight - logoSize, midY - logoSize / 2, logoSize);
  }

  const centerX = (textLeft + textRight) / 2;
  const provisionalVs = Math.max(preferredNameSize * 0.55, 14);
  setFont(ctx, 800, provisionalVs);
  const vsHalf = ctx.measureText("VS").width / 2 + 11;
  const maxSide = Math.max(40, (textRight - textLeft) / 2 - vsHalf);
  const availableWidth = Math.max(40, textRight - textLeft - vsHalf * 2);

  const symmetricSize = Math.min(
    fitFontSize(ctx, teamA, 800, maxSide, preferredNameSize, 16),
    fitFontSize(ctx, teamB, 800, maxSide, preferredNameSize, 16),
  );

  let nameSize = symmetricSize;
  let teamAEnd = centerX - vsHalf; // правый край названия первой команды
  let teamBStart = centerX + vsHalf; // левый край названия второй команды
  let vsX = centerX;
  let textA = teamA;
  let textB = teamB;

  if (symmetricSize < preferredNameSize) {
    // Одно из названий длинное: не сжимаем обе команды, а делим место по их длине.
    const minSize = 18;
    nameSize = Math.min(preferredNameSize, symmetricSize * 2);
    while (nameSize > minSize) {
      setFont(ctx, 800, nameSize);
      if (ctx.measureText(teamA).width + ctx.measureText(teamB).width <= availableWidth) break;
      nameSize -= 2;
    }
    nameSize = Math.max(nameSize, minSize);
    setFont(ctx, 800, nameSize);

    let widthA = ctx.measureText(teamA).width;
    let widthB = ctx.measureText(teamB).width;
    if (widthA + widthB > availableWidth) {
      // Даже на минимальном размере не влезает: обрезаем более длинное название.
      const half = availableWidth / 2;
      if (widthA > half && widthB > half) {
        textA = truncateToWidth(ctx, teamA, half);
        textB = truncateToWidth(ctx, teamB, half);
      } else if (widthA > widthB) {
        textA = truncateToWidth(ctx, teamA, availableWidth - widthB);
      } else {
        textB = truncateToWidth(ctx, teamB, availableWidth - widthA);
      }
      widthA = ctx.measureText(textA).width;
      widthB = ctx.measureText(textB).width;
    }

    const startX = textLeft + (textRight - textLeft - (widthA + widthB + vsHalf * 2)) / 2;
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
export function drawMatches(
  ctx: Ctx,
  matches: Match[],
  region: Region,
  theme: Theme,
  logos: RenderLogo[] = [],
): void {
  const count = matches.length;
  if (count === 0) {
    drawPlaceholder(ctx, region);
    return;
  }

  const { rowHeight, gap, startY } = computeMatchesLayout(count, region);

  matches.forEach((match, index) => {
    drawRow(ctx, match, region.x, startY + index * (rowHeight + gap), region.w, rowHeight, theme, logos);
  });
}
