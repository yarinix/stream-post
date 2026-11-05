import type { CanvasPresetId, MatchFormat, PostMode, Theme, ThemeId } from "./types";

export const MAX_MATCHES = 8;

/** Максимальный счёт в одной колонке: BO7 предполагает не больше 4 побед, 9 — с запасом. */
export const MAX_SCORE = 9;

export interface PostModeInfo {
  id: PostMode;
  /** Название в переключателе и на главной. */
  label: string;
  /** Короткая подпись для нижней панели на узких экранах. */
  short: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Надпись над заголовком на картинке. */
  headerLabel: string;
  /** Заголовок секции со списком матчей в тексте поста. */
  sectionTitle: string;
  /** Подпись к полям счёта в редакторе. */
  scoreLabel: string;
  /** Подсказка под полями счёта. */
  scoreHint: string;
  /** Подпись к полям коэффициентов (только «Предикты»). */
  oddsLabel: string;
  /** Подсказка к полям коэффициентов. */
  oddsHint: string;
  /** Маленькая надпись над заголовком на постере. */
  posterEyebrow: string;
  /** Строки большого наклонного заголовка на постере. */
  posterHeadline: string[];
  /** Подзаголовок на постере. */
  posterSubline: string;
  /** Призыв в футере постера. */
  posterFooterLead: string;
  /** Суффикс имени PNG-файла. */
  fileSuffix: string;
}

/** Общие данные матчей переиспользуются, меняется только смысл центральной колонки. */
export const POST_MODES: Record<PostMode, PostModeInfo> = {
  schedule: {
    id: "schedule",
    label: "Расписание",
    short: "Расписание",
    eyebrow: "MLBB · КАРТИНКА ДЛЯ TELEGRAM",
    title: "Расписание матчей",
    subtitle:
      "Меняйте данные пальцем — картинка и текст поста обновляются сами. Черновик, логотипы и ссылка на стрим сохраняются на устройстве.",
    headerLabel: "РАСПИСАНИЕ МАТЧЕЙ",
    sectionTitle: "РАСПИСАНИЕ МАТЧЕЙ",
    scoreLabel: "",
    scoreHint: "",
    oddsLabel: "",
    oddsHint: "",
    posterEyebrow: "РАСПИСАНИЕ МАТЧЕЙ",
    posterHeadline: ["РАСПИСАНИЕ МАТЧЕЙ"],
    posterSubline: "",
    posterFooterLead: "",
    fileSuffix: "",
  },
  predict: {
    id: "predict",
    label: "Предикты",
    short: "Предикты",
    eyebrow: "MLBB · ПРОГНОЗ СТРИМЕРА",
    title: "Предикты на матчи",
    subtitle:
      "Укажите коэффициенты на победу — они появятся в плашках на картинке. Прогноз счёта задаётся отдельно и попадает в текст поста.",
    headerLabel: "ПРЕДИКТЫ СТРИМЕРА",
    sectionTitle: "ПРОГНОЗЫ НА МАТЧИ",
    scoreLabel: "Прогноз счёта",
    scoreHint: "Счёт, который ждёт стример: уходит в текст поста. Хранится отдельно от итогов дня.",
    oddsLabel: "Коэффициенты (для картинки)",
    oddsHint: "Например 1.48 и 2.62. Незаполненное значение на картинке остаётся прочерком.",
    posterEyebrow: "ПРЕДИКТЫ",
    posterHeadline: ["ПРЕДИКТЫ", "НА ДЕНЬ"],
    posterSubline: "Кто победит сегодня?",
    posterFooterLead: "Делитесь своими прогнозами в комментариях!",
    fileSuffix: "predict",
  },
  results: {
    id: "results",
    label: "Итоги дня",
    short: "Итоги",
    eyebrow: "MLBB · ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ",
    title: "Итоги дня",
    subtitle:
      "Внесите финальный счёт матчей — картинка покажет результаты и выделит победителя. Прогнозы при этом остаются нетронутыми.",
    headerLabel: "ИТОГИ ДНЯ",
    sectionTitle: "РЕЗУЛЬТАТЫ МАТЧЕЙ",
    scoreLabel: "Финальный счёт",
    scoreHint: "Победитель подсвечивается на картинке. Незаполненные матчи остаются без счёта.",
    oddsLabel: "",
    oddsHint: "",
    posterEyebrow: "ИТОГ ДНЯ",
    posterHeadline: ["ИТОГ ДНЯ"],
    posterSubline: "Как прошёл игровой день?",
    posterFooterLead: "Следите за новостями:",
    fileSuffix: "results",
  },
};

export const POST_MODE_IDS = Object.keys(POST_MODES) as PostMode[];

export function isPostMode(value: string | null | undefined): value is PostMode {
  return value === "schedule" || value === "predict" || value === "results";
}

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
