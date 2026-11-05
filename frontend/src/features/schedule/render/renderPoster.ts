import { CANVAS_PRESETS, POST_MODES, THEMES } from "../constants";
import { oddsText } from "../odds";
import { findTeamLogo } from "../logos/types";
import type { RenderLogo } from "../logos/types";
import { formatScore, getScore, winnerSide } from "../score";
import type { Match, PostMode, ScheduleData, Theme } from "../types";
import { drawBackground } from "./drawBackground";
import {
  fitFontSize,
  hexToRgba,
  setFont,
  truncateToWidth,
  withLetterSpacing,
  type Ctx,
  type Region,
} from "./helpers";
import {
  POSTER_PADDING,
  drawChatIcon,
  drawPosterCard,
  drawPosterLogoSlot,
  drawPosterPill,
  drawSkewedText,
  drawTelegramIcon,
  measureSkewed,
} from "./posterCommon";

type PosterMode = Exclude<PostMode, "schedule">;

const MAX_GAP = 46;

function baseGap(count: number): number {
  if (count <= 2) return 30;
  if (count === 3) return 24;
  if (count === 4) return 20;
  if (count === 5) return 16;
  return 12;
}

/** Раскладка карточек: подстраивается под количество матчей и доступную высоту. */
function layoutRows(count: number, region: Region): { rowHeight: number; gap: number; startY: number } {
  const available = Math.max(0, region.h);
  const maxRow = Math.min(420, Math.max(90, available * 0.55));
  let gap = baseGap(count);
  let rowHeight = Math.min(maxRow, Math.max(60, (available - gap * (count - 1)) / count));
  let total = rowHeight * count + gap * (count - 1);

  if (count > 1 && available > total) {
    gap = Math.min(MAX_GAP, gap + (available - total) / (count - 1));
    total = rowHeight * count + gap * (count - 1);
  }
  if (total > available) {
    gap = Math.max(6, gap - (total - available) / Math.max(1, count - 1));
    total = rowHeight * count + gap * (count - 1);
  }
  if (total > available) {
    rowHeight = Math.max(50, (available - gap * (count - 1)) / count);
    total = rowHeight * count + gap * (count - 1);
  }

  // Блок карточек центрируется в отведённой области: поля сверху и снизу равны.
  const startY = region.y + Math.max(0, (available - total) / 2);
  return { rowHeight, gap, startY };
}

/**
 * Карточка матча построена на одной симметричной сетке:
 * верхняя полоса — логотип / название / «vs» / название / логотип,
 * нижняя — три колонки значений строго по центру и по краям.
 * У обеих сторон одинаковые слоты, отступы и максимальная ширина названия.
 */
function drawRow(
  ctx: Ctx,
  match: Match,
  x: number,
  y: number,
  w: number,
  h: number,
  k: number,
  theme: Theme,
  logos: RenderLogo[],
  mode: PosterMode,
): void {
  drawPosterCard(ctx, x, y, w, h, Math.min(20, h * 0.16), theme);

  const inset = Math.max(24, w * 0.03);
  const centerX = x + w / 2;
  const teamsY = y + h * 0.33;
  const valuesY = y + h * 0.71;

  const logoSize = Math.min(h * 0.36, 96, w * 0.095);
  const logoACx = x + inset + logoSize / 2;
  const logoBCx = x + w - inset - logoSize / 2;
  const gapAfterLogo = Math.max(14, w * 0.018);
  const nameAX = logoACx + logoSize / 2 + gapAfterLogo;
  const nameBX = logoBCx - logoSize / 2 - gapAfterLogo;
  const centerSafe = Math.max(34, w * 0.055);
  const nameMaxW = Math.max(60, centerX - centerSafe - nameAX);

  const logoA = findTeamLogo(logos, match.teamA, match.logoA);
  const logoB = findTeamLogo(logos, match.teamB, match.logoB);
  const winner = winnerSide(match, mode);
  const stateA = winner === "a" ? "win" : winner === "b" ? "lose" : "normal";
  const stateB = winner === "b" ? "win" : winner === "a" ? "lose" : "normal";

  drawPosterLogoSlot(ctx, logoACx, teamsY, logoSize, theme, stateA, logoA);
  drawPosterLogoSlot(ctx, logoBCx, teamsY, logoSize, theme, stateB, logoB);

  const teamA = (match.teamA.trim() || "TBD").toUpperCase();
  const teamB = (match.teamB.trim() || "TBD").toUpperCase();
  const maxNameSize = Math.min(44, Math.max(20, h * 0.22));
  const nameSize = Math.min(
    fitFontSize(ctx, teamA, 800, nameMaxW, maxNameSize, 18),
    fitFontSize(ctx, teamB, 800, nameMaxW, maxNameSize, 18),
  );

  ctx.save();
  ctx.textBaseline = "middle";
  setFont(ctx, 800, nameSize);
  ctx.textAlign = "left";
  ctx.fillStyle = stateA === "win" ? theme.accent : stateA === "lose" ? "rgba(255, 255, 255, 0.5)" : "#ffffff";
  ctx.fillText(truncateToWidth(ctx, teamA, nameMaxW), nameAX, teamsY);
  ctx.textAlign = "right";
  ctx.fillStyle = stateB === "win" ? theme.accent : stateB === "lose" ? "rgba(255, 255, 255, 0.5)" : "#ffffff";
  ctx.fillText(truncateToWidth(ctx, teamB, nameMaxW), nameBX, teamsY);

  // Якорь центральной оси: до матча «vs», после — время начала.
  // В обеих режимах он на одной горизонтали с названиями и строго по центру.
  const anchor = mode === "predict" ? "vs" : match.time.trim() || "—";
  setFont(ctx, 700, Math.max(15, Math.min(23, nameSize * 0.58)));
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fillText(anchor, centerX, teamsY);
  ctx.restore();

  const pillH = Math.min(Math.max(h * 0.26, 30), 68);
  const labelSize = Math.max(13, Math.min(20, h * 0.105));

  if (mode === "predict") {
    // Три симметричные плашки: коэффициент / прогноз счёта / коэффициент.
    const sideW = Math.min(w * 0.19, 190);
    const centerW = Math.min(w * 0.26, 250);
    const sideOffset = w * 0.285;
    const prediction = getScore(match, "predict");

    drawPosterPill(ctx, centerX - sideOffset, valuesY, sideW, pillH, oddsText(match, "a"), theme, "normal");
    drawPosterPill(
      ctx,
      centerX,
      valuesY,
      centerW,
      pillH,
      prediction ? formatScore(prediction) : "? : ?",
      theme,
      "accent",
    );
    drawPosterPill(ctx, centerX + sideOffset, valuesY, sideW, pillH, oddsText(match, "b"), theme, "normal");

    if (h >= 160) {
      ctx.save();
      setFont(ctx, 700, labelSize);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
      ctx.fillText("ПРОГНОЗ СЧЁТА", centerX, valuesY + pillH / 2 + 19 * k);
      ctx.restore();
    }
  } else {
    // Итоги: счёт — единый бейдж строго по центру, без «разбросанных» цифр.
    const score = getScore(match, "results");
    const centerW = Math.min(w * 0.32, 290);
    drawPosterPill(
      ctx,
      centerX,
      valuesY,
      centerW,
      pillH,
      score ? formatScore(score) : "— : —",
      theme,
      score ? "accent" : "normal",
    );

    // Симметричные направляющие по бокам бейджа заполняют пустые зоны.
    const lineW = Math.min(w * 0.11, 110);
    const lineGap = 22 * k;
    ctx.fillStyle = hexToRgba(theme.accent, 0.4);
    ctx.fillRect(centerX - centerW / 2 - lineGap - lineW, valuesY - 1, lineW, 2);
    ctx.fillRect(centerX + centerW / 2 + lineGap, valuesY - 1, lineW, 2);

    if (h >= 160) {
      ctx.save();
      setFont(ctx, 700, labelSize);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
      ctx.fillText(`${match.format} · ФИНАЛЬНЫЙ СЧЁТ`, centerX, valuesY + pillH / 2 + 19 * k);
      ctx.restore();
    }
  }
}

function drawMatches(
  ctx: Ctx,
  matches: Match[],
  region: Region,
  k: number,
  theme: Theme,
  logos: RenderLogo[],
  mode: PosterMode,
): void {
  if (matches.length === 0) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, 700, 36);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("Добавьте матчи", region.x + region.w / 2, region.y + region.h / 2);
    ctx.restore();
    return;
  }

  const { rowHeight, gap, startY } = layoutRows(matches.length, region);
  matches.forEach((match, index) => {
    drawRow(ctx, match, region.x, startY + index * (rowHeight + gap), region.w, rowHeight, k, theme, logos, mode);
  });
}

interface FooterOptions {
  width: number;
  padding: number;
  top: number;
  height: number;
  theme: Theme;
  /** Ссылка на Telegram-канал (только «Итоги дня»). */
  telegram: string;
  mode: PosterMode;
  lead: string;
}

/** Единая сетка футера: точка слева, две строки по центру, иконка справа. */
function drawFooter(ctx: Ctx, options: FooterOptions): void {
  const { width, padding, top, height, theme, telegram, mode, lead } = options;
  const k = height / 150;

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(padding, top, width - padding * 2, 2);

  const leadSize = 27 * k;
  const linkSize = 30 * k;
  const line1H = 34 * k;
  const line2H = 40 * k;
  const lineGap = 8 * k;
  const contentH = line1H + lineGap + line2H;
  const contentTop = top + (height - contentH) / 2;
  const midY = contentTop + contentH / 2;

  const dotR = 7 * k;
  const textX = padding + dotR * 2 + 18 * k;
  const iconSize = 46 * k;
  const iconX = width - padding - iconSize;
  const maxTextW = Math.max(80, iconX - 24 * k - textX);

  ctx.beginPath();
  ctx.arc(padding + dotR, midY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  if (mode === "predict") {
    setFont(ctx, 600, leadSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText("Делитесь своими прогнозами", textX, contentTop + line1H / 2);
    ctx.fillText("в комментариях!", textX, contentTop + line1H + lineGap + line2H / 2);
    drawChatIcon(ctx, iconX, midY - iconSize / 2, iconSize, theme);
  } else {
    setFont(ctx, 600, leadSize);
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.fillText(lead, textX, contentTop + line1H / 2);

    if (telegram) {
      setFont(ctx, 800, linkSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(truncateToWidth(ctx, telegram, maxTextW), textX, contentTop + line1H + lineGap + line2H / 2);
    }
    drawTelegramIcon(ctx, iconX, midY - iconSize / 2, iconSize);
  }
  ctx.restore();
}

/**
 * Постер «Предикты» / «Итоги дня» в стиле референса: наклонный заголовок,
 * подзаголовок, акцентная линия, симметричные карточки и футер.
 * Расписание рисуется старым конвейером renderSchedule и не затрагивается.
 */
export function renderPoster(
  data: ScheduleData,
  logos: RenderLogo[] = [],
  mode: PosterMode = "predict",
): HTMLCanvasElement {
  const preset = CANVAS_PRESETS[data.preset];
  const theme = THEMES[data.theme];
  const { width, height } = preset;
  const info = POST_MODES[mode];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается в этом браузере");

  drawBackground(ctx, width, height, theme, 0.55);

  const pad = POSTER_PADDING;
  const innerWidth = width - pad * 2;
  const compact = height <= 1100;
  const k = compact ? 0.82 : 1;

  // --- Шапка: все элементы выровнены по левой границе pad ---
  let y = pad + 20 * k;
  const eyebrowSize = 30 * k;
  setFont(ctx, 800, eyebrowSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = theme.accent;
  withLetterSpacing(ctx, 7 * k, () => ctx.fillText(info.posterEyebrow, pad, y));
  y += eyebrowSize + 32 * k;

  let headSize = compact ? 100 : 124;
  while (headSize > 52 && !info.posterHeadline.every((line) => measureSkewed(ctx, line, 900, headSize) <= innerWidth - 12)) {
    headSize -= 4;
  }
  const lineHeight = headSize * 1.02;
  info.posterHeadline.forEach((line, index) => {
    drawSkewedText(ctx, line, pad, y + index * lineHeight, headSize, 900, "#ffffff");
  });
  y += info.posterHeadline.length * lineHeight + 22 * k;

  const subSize = 44 * k;
  setFont(ctx, 600, subSize);
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(info.posterSubline, pad, y);
  y += subSize + 26 * k;

  ctx.fillStyle = theme.accent;
  ctx.fillRect(pad, y, 168 * k, 8 * k);
  const headerBottom = y + 8 * k + 40 * k;

  // --- Футер ---
  const footerHeight = compact ? 128 : 150;
  const footerTop = height - footerHeight;
  drawFooter(ctx, {
    width,
    padding: pad,
    top: footerTop,
    height: footerHeight,
    theme,
    telegram: data.telegramChannel.trim(),
    mode,
    lead: info.posterFooterLead,
  });

  // --- Карточки: одинаковые вертикальные поля сверху и снизу ---
  const gapV = 28 * k;
  drawMatches(
    ctx,
    data.matches,
    {
      x: pad,
      y: headerBottom + gapV,
      w: innerWidth,
      h: Math.max(0, footerTop - headerBottom - 2 * gapV),
    },
    k,
    theme,
    logos,
    mode,
  );

  return canvas;
}
