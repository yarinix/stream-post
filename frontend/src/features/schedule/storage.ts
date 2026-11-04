import { CANVAS_PRESETS, MATCH_FORMATS, MAX_MATCHES, THEMES } from "./constants";
import { createDefaultSchedule, newMatchId } from "./defaults";
import { clampScore } from "./score";
import type { CanvasPresetId, Match, MatchFormat, ScheduleData, ThemeId } from "./types";

const STORAGE_KEY = "stream-post:schedule-draft:v1";

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asLogoId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeMatch(input: unknown): Match | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const format = MATCH_FORMATS.includes(raw.format as MatchFormat)
    ? (raw.format as MatchFormat)
    : "BO3";
  return {
    id: newMatchId(),
    teamA: asString(raw.teamA, ""),
    teamB: asString(raw.teamB, ""),
    time: asString(raw.time, "18:00"),
    format,
    logoA: asLogoId(raw.logoA),
    logoB: asLogoId(raw.logoB),
    predictA: clampScore(raw.predictA),
    predictB: clampScore(raw.predictB),
    resultA: clampScore(raw.resultA),
    resultB: clampScore(raw.resultB),
  };
}

function sanitize(input: unknown): ScheduleData | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const base = createDefaultSchedule();

  const matches = Array.isArray(raw.matches)
    ? raw.matches
        .slice(0, MAX_MATCHES)
        .map(sanitizeMatch)
        .filter((match): match is Match => match !== null)
    : base.matches;

  const preset = (raw.preset as string) in CANVAS_PRESETS ? (raw.preset as CanvasPresetId) : base.preset;
  const theme = (raw.theme as string) in THEMES ? (raw.theme as ThemeId) : base.theme;

  return {
    tournament: asString(raw.tournament, base.tournament),
    stage: asString(raw.stage, base.stage),
    date: asString(raw.date, base.date),
    timezone: asString(raw.timezone, base.timezone),
    channel: asString(raw.channel, base.channel),
    matches,
    preset,
    theme,
  };
}

// localStorage может быть недоступен (приватный режим и т.п.) — тогда просто работаем без черновика.
export function loadSchedule(): ScheduleData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSchedule(data: ScheduleData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // игнорируем: черновик не критичен
  }
}
