/** Настройки текста поста. Хранятся отдельно от черновика расписания. */
export interface PostTextSettings {
  /** Постоянная ссылка на трансляцию — сохраняется между постами. */
  streamLink: string;
  /** Подставлять сегодняшнюю дату вместо даты из черновика. */
  autoDate: boolean;
  /** Сортировать матчи в тексте по времени — первым идёт самый ранний. */
  sortByTime: boolean;
  /** Добавлять часовой пояс к дате в шапке текста. */
  includeTimezone: boolean;
}

export const DEFAULT_POST_TEXT_SETTINGS: PostTextSettings = {
  streamLink: "",
  autoDate: true,
  sortByTime: true,
  includeTimezone: true,
};

/** Ручная правка итогового текста. signature защищает от склеивания со старыми данными. */
export interface PostTextDraft {
  signature: string;
  text: string;
}

const SETTINGS_KEY = "stream-post:post-text-settings:v1";
const DRAFT_KEY = "stream-post:post-text-draft:v1";

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, 300) : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// localStorage может быть недоступен (приватный режим и т.п.) — работаем без сохранения.
function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // игнорируем: сохранение не критично
  }
}

export function loadPostTextSettings(): PostTextSettings {
  const raw = readJson(SETTINGS_KEY);
  if (!raw || typeof raw !== "object") return { ...DEFAULT_POST_TEXT_SETTINGS };
  const value = raw as Record<string, unknown>;
  return {
    streamLink: asString(value.streamLink, DEFAULT_POST_TEXT_SETTINGS.streamLink),
    autoDate: asBool(value.autoDate, DEFAULT_POST_TEXT_SETTINGS.autoDate),
    sortByTime: asBool(value.sortByTime, DEFAULT_POST_TEXT_SETTINGS.sortByTime),
    includeTimezone: asBool(value.includeTimezone, DEFAULT_POST_TEXT_SETTINGS.includeTimezone),
  };
}

export function savePostTextSettings(settings: PostTextSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function loadPostTextDraft(): PostTextDraft | null {
  const raw = readJson(DRAFT_KEY);
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.signature !== "string" || typeof value.text !== "string") return null;
  return { signature: value.signature, text: value.text.slice(0, 8000) };
}

export function savePostTextDraft(draft: PostTextDraft | null): void {
  if (!draft) {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // игнорируем
    }
    return;
  }
  writeJson(DRAFT_KEY, draft);
}
