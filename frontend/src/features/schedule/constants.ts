import type { CanvasPresetId, MatchFormat, Theme, ThemeId } from "./types";

export const MAX_MATCHES = 8;

export const MATCH_FORMATS: MatchFormat[] = ["BO1", "BO2", "BO3", "BO5", "BO7"];

export interface CanvasPreset {
  label: string;
  hint: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: Record<CanvasPresetId, CanvasPreset> = {
  post: { label: "Пост 4:5", hint: "1080×1350", width: 1080, height: 1350 },
  square: { label: "Квадрат", hint: "1080×1080", width: 1080, height: 1080 },
  story: { label: "Сторис 9:16", hint: "1080×1920", width: 1080, height: 1920 },
};

export const PRESET_IDS = Object.keys(CANVAS_PRESETS) as CanvasPresetId[];

export const THEMES: Record<ThemeId, Theme> = {
  violet: {
    label: "Фиолетовый",
    accent: "#8b6cff",
    glow: "#5b3df5",
    bgTop: "#0d0b1f",
    bgBottom: "#171033",
    onAccent: "#0b0d14",
  },
  gold: {
    label: "Золотой",
    accent: "#f5c451",
    glow: "#b8860b",
    bgTop: "#0f0d08",
    bgBottom: "#1c160a",
    onAccent: "#0b0d14",
  },
  crimson: {
    label: "Красный",
    accent: "#ff4d5e",
    glow: "#c1121f",
    bgTop: "#120a0c",
    bgBottom: "#1f0c10",
    onAccent: "#0b0d14",
  },
  cyan: {
    label: "Бирюзовый",
    accent: "#22d3ee",
    glow: "#0891b2",
    bgTop: "#07111a",
    bgBottom: "#0a1c2b",
    onAccent: "#0b0d14",
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const TIMEZONE_SUGGESTIONS = ["МСК", "Киев", "Минск", "Алматы", "Омск", "UTC"];
