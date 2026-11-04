import { CANVAS_PRESETS, THEMES } from "../constants";
import { formatDateRu } from "../format";
import type { RenderLogo } from "../logos/types";
import type { ScheduleData } from "../types";
import { drawBackground } from "./drawBackground";
import { drawFooter, footerHeight } from "./drawFooter";
import { drawHeader } from "./drawHeader";
import { drawMatches } from "./drawMatches";

const PADDING = 64;

/** Рисует картинку с расписанием и возвращает canvas. Шрифты и логотипы должны быть загружены заранее. */
export function renderSchedule(data: ScheduleData, logos: RenderLogo[] = []): HTMLCanvasElement {
  const preset = CANVAS_PRESETS[data.preset];
  const theme = THEMES[data.theme];
  const { width, height } = preset;
  const compact = height <= 1100;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается в этом браузере");

  drawBackground(ctx, width, height, theme);

  const headerBottom = drawHeader(ctx, {
    width,
    padding: PADDING,
    compact,
    theme,
    tournament: data.tournament,
    stage: data.stage,
    dateText: formatDateRu(data.date),
    timezone: data.timezone,
  });

  const top = headerBottom + (compact ? 28 : 44);
  const bottom = height - footerHeight(data.channel) - 24;
  drawMatches(
    ctx,
    data.matches,
    { x: PADDING, y: top, w: width - PADDING * 2, h: Math.max(0, bottom - top) },
    theme,
    logos,
  );

  drawFooter(ctx, { width, height, padding: PADDING, theme, channel: data.channel });

  return canvas;
}
