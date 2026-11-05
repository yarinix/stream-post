export type MatchFormat = "BO1" | "BO2" | "BO3" | "BO5" | "BO7";

export type CanvasPresetId = "post" | "square" | "story";

export type ThemeId = "violet" | "gold" | "crimson" | "cyan";

/** Тип поста: одни и те же матчи, но разное содержимое центра строк. */
export type PostMode = "schedule" | "predict" | "results";

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  /** Время в формате HH:MM (как отдаёт <input type="time">). */
  time: string;
  format: MatchFormat;
  /** Явно выбранный логотип (id из библиотеки). null — подобрать по названию команды. */
  logoA?: string | null;
  logoB?: string | null;
  /** Прогноз стримера. null — счёт ещё не выставлен. Используется в тексте поста. */
  predictA?: number | null;
  predictB?: number | null;
  /** Финальный результат матча. null — матч ещё не сыгран. */
  resultA?: number | null;
  resultB?: number | null;
  /** Коэффициенты на победу (только картинка «Предикты»). null — не заполнено. */
  oddsA?: string | null;
  oddsB?: string | null;
}

export interface ScheduleData {
  tournament: string;
  stage: string;
  /** Дата в формате YYYY-MM-DD или пустая строка. */
  date: string;
  timezone: string;
  channel: string;
  /** Ссылка на Telegram-канал для футера постера «Итоги дня». */
  telegramChannel: string;
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
