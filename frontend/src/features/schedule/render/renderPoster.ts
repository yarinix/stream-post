import { CANVAS_PRESETS, POST_MODES, THEMES } from "../constants";
import { oddsText } from "../odds";
import { findTeamLogo } from "../logos/types";
import type { RenderLogo } from "../logos/types";
import { getScore, winnerSide } from "../score";
import type { Match, PostMode, ScheduleData, Theme } from "../types";
import { drawBackground } from "./drawBackground";
import { fitFontSize, setFont, truncateToWidth, withLetterSpacing, type Ctx, type Region } from "./helpers";
import {
  POSTER_PADDING,
  drawChatIcon,
  drawPosterCard,
  drawPosterLogo,
  drawPosterPill,
  drawSkewedText,
  drawTwitchIcon,
  measureSkewed,
  type PillState,
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
  // Карточки заполняют почти всю область между шапкой и футером: на референсе
  // между акцентной линией и первой карточкой нет большой пустой «дыры».
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

  const startY = region.y + Math.max(0, (available - total) / 2);
  return { rowHeight, gap, startY };
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
  mode: PosterMode,
): void {
  drawPosterCard(ctx, x, y, w, h, Math.min(20, h * 0.16), theme);

  const inset = Math.max(20, w * 0.025);
  const logoSize = Math.min(h * 0.4, 108, w * 0.11);
  const logoA = findTeamLogo(logos, match.teamA, match.logoA);
  const logoB = findTeamLogo(logos, match.teamB, match.logoB);

  const teamsY = y + h * 0.34;
  const pillsY = y + h * 0.76;
  const pillH = Math.min(Math.max(h * 0.25, 26), 62);
  const pillW = Math.min(w * 0.21, 200);
  const centerX = x + w / 2;
  const vsHalf = Math.max(30, w * 0.045);

  if (logoA) drawPosterLogo(ctx, logoA, x + inset, teamsY - logoSize / 2, logoSize);
  if (logoB) drawPosterLogo(ctx, logoB, x + w - inset - logoSize, teamsY - logoSize / 2, logoSize);

  const nameLeft = x + inset + (logoA ? logoSize + 18 : 0);
  const nameRight = x + w - inset - (logoB ? logoSize + 18 : 0);
  const maxNameWidth = Math.max(60, centerX - vsHalf - nameLeft);
  const maxNameSize = Math.min(42, Math.max(20, h * 0.2));

  const teamA = (match.teamA.trim() || "TBD").toUpperCase();
  const teamB = (match.teamB.trim() || "TBD").toUpperCase();
  const nameSize = Math.min(
    fitFontSize(ctx, teamA, 800, maxNameWidth, maxNameSize, 18),
    fitFontSize(ctx, teamB, 800, Math.max(60, nameRight - centerX - vsHalf), maxNameSize, 18),
  );

  const winner = winnerSide(match, mode);
  const colorA = winner === "a" ? theme.accent : winner === "b" ? "rgba(255, 255, 255, 0.5)" : "#ffffff";
  const colorB = winner === "b" ? theme.accent : winner === "a" ? "rgba(255, 255, 255, 0.5)" : "#ffffff";

  ctx.textBaseline = "middle";
  setFont(ctx, 800, nameSize);
  ctx.textAlign = "left";
  ctx.fillStyle = colorA;
  ctx.fillText(truncateToWidth(ctx, teamA, maxNameWidth), nameLeft, teamsY + 1);
  ctx.textAlign = "right";
  ctx.fillStyle = colorB;
  ctx.fillText(truncateToWidth(ctx, teamB, Math.max(60, nameRight - centerX - vsHalf)), nameRight, teamsY + 1);

  setFont(ctx, 700, Math.max(16, nameSize * 0.62));
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fillText("vs", centerX, teamsY + 1);

  // Тонкий разделитель ровно между двумя плашками.
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(centerX - 1, pillsY - pillH * 0.42, 2, pillH * 0.84);

  const score = mode === "results" ? getScore(match, "results") : null;
  const textA = mode === "predict" ? oddsText(match, "a") : score ? String(score.a) : "—";
  const textB = mode === "predict" ? oddsText(match, "b") : score ? String(score.b) : "—";
  const stateA: PillState = winner === "a" ? "win" : winner === "b" ? "lose" : "normal";
  const stateB: PillState = winner === "b" ? "win" : winner === "a" ? "lose" : "normal";

  drawPosterPill(ctx, x + w * 0.3, pillsY, pillW, pillH, textA, theme, stateA);
  drawPosterPill(ctx, x + w * 0.7, pillsY, pillW, pillH, textB, theme, stateB);
}

function drawMatches(
  ctx: Ctx,
  matches: Match[],
  region: Region,
  theme: Theme,
  logos: RenderLogo[],
  mode: PosterMode,
): void {
  if (matches.length === 0) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, 700, 36);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("Добавьте матчи", region.x + region.w / 2, region.y + region.h / 2);
    return;
  }

  const { rowHeight, gap, startY } = layoutRows(matches.length, region);
  matches.forEach((match, index) => {
    drawRow(ctx, match, region.x, startY + index * (rowHeight + gap), region.w, rowHeight, theme, logos, mode);
  });
}

interface FooterOptions {
  width: number;
  padding: number;
  top: number;
  height: number;
  theme: Theme;
  channel: string;
  mode: PosterMode;
  lead: string;
}

function drawFooter(ctx: Ctx, options: FooterOptions): void {
  const { width, padding, top, height, theme, channel, mode, lead } = options;
  const k = height / 150;

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(padding, top, width - padding * 2, 2);

  const textX = padding + 30 * k;
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(padding + 8 * k, top + 34 * k, 8 * k, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  if (mode === "predict") {
    // Призыв из референса разбит на две строки, чтобы не упираться в иконку.
    setFont(ctx, 600, 27 * k);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText("Делитесь своими прогнозами", textX, top + 20 * k);
    ctx.fillText("в комментариях!", textX, top + 54 * k);
    drawChatIcon(ctx, width - padding - 56 * k, top + 22 * k, 56 * k, theme);
  } else {
    setFont(ctx, 600, 27 * k);
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.fillText(lead, textX, top + 20 * k);
    if (channel) {
      const iconY = top + 62 * k;
      drawTwitchIcon(ctx, textX, iconY, 34 * k, "#ffffff");
      setFont(ctx, 800, 30 * k);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        truncateToWidth(ctx, channel, width - padding * 2 - 80 * k),
        textX + 46 * k,
        iconY + 2 * k,
      );
    }
  }
}

/**
 * Постер «Предикты» / «Итоги дня» в стиле референса: наклонный заголовок,
 * подзаголовок, акцентная линия, карточки с двумя плашками и призыв в футере.
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

  // Рамка на референсе заметнее, чем в расписании.
  drawBackground(ctx, width, height, theme, 0.55);

  const pad = POSTER_PADDING;
  const innerWidth = width - pad * 2;
  const compact = height <= 1100;
  const k = compact ? 0.82 : 1;

  // --- Шапка ---
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
    channel: data.channel.trim(),
    mode,
    lead: info.posterFooterLead,
  });

  // --- Карточки матчей ---
  const gapTop = 24 * k;
  const gapBottom = (compact ? 40 : 28) * k;
  drawMatches(
    ctx,
    data.matches,
    {
      x: pad,
      y: headerBottom + gapTop,
      w: innerWidth,
      h: Math.max(0, footerTop - (headerBottom + gapTop) - gapBottom),
    },
    theme,
    logos,
    mode,
  );

  return canvas;
}
