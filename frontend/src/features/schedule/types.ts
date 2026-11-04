export type MatchFormat = "BO1" | "BO2" | "BO3" | "BO5" | "BO7";

export type CanvasPresetId = "post" | "square" | "story";

export type ThemeId = "violet" | "gold" | "crimson" | "cyan";

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  /** Время в формате HH:MM (как отдаёт <input type="time">). */
  time: string;
  format: MatchFormat;
}

export interface ScheduleData {
  tournament: string;
  stage: string;
  /** Дата в формате YYYY-MM-DD или пустая строка. */
  date: string;
  timezone: string;
  channel: string;
  matches: Match[];
  preset: CanvasPresetId;
  theme: ThemeId;
}

export interface Theme {
  label: string;
  accent: string;
  glow: string;
  bgTop: string;
  bgBottom: string;
  /** Цвет текста на заливке акцентным цветом. */
  onAccent: string;
}
