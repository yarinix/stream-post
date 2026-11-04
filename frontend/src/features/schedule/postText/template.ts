import { POST_MODES } from "../constants";
import { todayIso } from "../defaults";
import { formatDateRu } from "../format";
import { getScore } from "../score";
import type { Match, PostMode, ScheduleData } from "../types";
import type { PostTextSettings } from "./settings";

/** Шаблон подписи к фотографии. Плейсхолдеры заполняются из данных формы. */
export const POST_TEMPLATE = `🏆 {{TOURNAMENT_NAME}}

━━━━━━━━━━━━━━━━━━

⚔️ {{STAGE}}
📅 {{DATE}}

РАСПИСАНИЕ МАТЧЕЙ

{{MATCH_LIST}}

━━━━━━━━━━━━━━━━━━

📺 ТРАНСЛЯЦИЯ
{{STREAM LINK}}

🔥 До встречи на трансляции!`;

interface TemplateVars {
  tournament: string;
  stage: string;
  date: string;
  matchList: string;
  streamLink: string;
}

export function renderPostTemplate(vars: TemplateVars, mode: PostMode = "schedule"): string {
  // Функции в replace — чтобы символы вроде "$&" в данных не трактовались как шаблон.
  let text = POST_TEMPLATE.replace("{{TOURNAMENT_NAME}}", () => vars.tournament)
    .replace("{{DATE}}", () => vars.date)
    .replace("{{MATCH_LIST}}", () => vars.matchList)
    // Поддерживаем оба написания: {{STREAM LINK}} из шаблона и {{STREAM_LINK}} для совместимости.
    .replace(/\{\{STREAM[ _]LINK\}\}/, () => vars.streamLink);

  // В предиктах и итогах меняется только заголовок секции — сам шаблон остаётся прежним.
  if (mode !== "schedule") {
    text = text.replace("РАСПИСАНИЕ МАТЧЕЙ", () => POST_MODES[mode].sectionTitle);
  }

  // Пустая стадия не должна оставлять строку «⚔️ » — убираем строку целиком.
  return vars.stage
    ? text.replace("{{STAGE}}", () => vars.stage)
    : text.replace(/^.*\{\{STAGE\}\}.*\n/m, "");
}

/** "9:00" → "09:00". Некорректное время оставляем как есть. */
export function normalizeTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time.trim() || "--:--";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function timeMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return Number.POSITIVE_INFINITY;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return Number.POSITIVE_INFINITY;
  return hours * 60 + minutes;
}

/** Пустые строки матчей (обе команды не заполнены) в текст не попадают. */
export function hasTeams(match: Match): boolean {
  return Boolean(match.teamA.trim() || match.teamB.trim());
}

export function matchLine(match: Match, mode: PostMode = "schedule"): string {
  const teamA = match.teamA.trim() || "TBD";
  const teamB = match.teamB.trim() || "TBD";
  const time = normalizeTime(match.time);
  const score = getScore(match, mode);

  // Итоги: счёт заменяет «vs», если он заполнен.
  if (mode === "results" && score) {
    return `${time} — ${teamA} ${score.a}:${score.b} ${teamB} (${match.format})`;
  }
  const base = `${time} — ${teamA} vs ${teamB} (${match.format})`;
  // Предикты: прогноз добавляется в конец строки, сами команды остаются на месте.
  if (mode === "predict" && score) {
    return `${base} · прогноз ${score.a}:${score.b}`;
  }
  return base;
}

/** Устойчивая сортировка по времени: матчи с некорректным временем уходят в конец. */
export function sortMatchesByTime(matches: Match[]): Match[] {
  return matches
    .map((match, index) => ({ match, minutes: timeMinutes(match.time), index }))
    .sort((a, b) => a.minutes - b.minutes || a.index - b.index)
    .map((entry) => entry.match);
}

/** Первый матч определяется автоматически по самому раннему времени, независимо от порядка ввода. */
export function findFirstMatch(matches: Match[]): Match | null {
  let first: Match | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const match of matches) {
    if (!hasTeams(match)) continue;
    const minutes = timeMinutes(match.time);
    if (minutes < best) {
      best = minutes;
      first = match;
    }
  }
  return first;
}

export interface PostTextInfo {
  /** Дата в человекочитаемом виде (уже с часовым поясом, если он включён). */
  dateLabel: string;
  firstMatch: string | null;
  matchCount: number;
  mode: PostMode;
  streamLink: string;
  /** true — ссылка взята из поля «Канал внизу картинки», потому что в настройках пусто. */
  streamFromChannel: boolean;
  autoDateUsed: boolean;
}

export interface PostTextResult {
  text: string;
  /** Отпечаток исходных данных: по нему проверяем, не устарела ли ручная правка. */
  signature: string;
  info: PostTextInfo;
}

export function postTextSignature(
  data: ScheduleData,
  settings: PostTextSettings,
  dateIso: string,
  mode: PostMode = "schedule",
): string {
  return JSON.stringify({
    mode,
    tournament: data.tournament.trim(),
    stage: data.stage.trim(),
    date: dateIso,
    timezone: settings.includeTimezone ? data.timezone.trim() : "",
    streamLink: settings.streamLink.trim() || data.channel.trim(),
    autoDate: settings.autoDate,
    sortByTime: settings.sortByTime,
    matches: data.matches.map((match) => [
      match.time,
      match.teamA.trim(),
      match.teamB.trim(),
      match.format,
      match.predictA,
      match.predictB,
      match.resultA,
      match.resultB,
    ]),
  });
}

export function buildPostText(
  data: ScheduleData,
  settings: PostTextSettings,
  mode: PostMode = "schedule",
): PostTextResult {
  const dateIso = settings.autoDate ? todayIso() : data.date;
  const readableDate = formatDateRu(dateIso) || formatDateRu(todayIso()) || dateIso;
  const dateLabel =
    settings.includeTimezone && data.timezone.trim()
      ? `${readableDate} · ${data.timezone.trim()}`
      : readableDate;

  const filled = data.matches.filter(hasTeams);
  const ordered = settings.sortByTime ? sortMatchesByTime(filled) : filled;
  const matchList = ordered.length
    ? ordered.map((match) => matchLine(match, mode)).join("\n")
    : "—";

  const streamFromChannel = !settings.streamLink.trim() && Boolean(data.channel.trim());
  const streamLink = settings.streamLink.trim() || data.channel.trim() || "ссылка не указана";

  const first = findFirstMatch(data.matches);
  const text = renderPostTemplate(
    {
      tournament: data.tournament.trim() || "Турнир",
      stage: data.stage.trim(),
      date: dateLabel,
      matchList,
      streamLink,
    },
    mode,
  );

  return {
    text,
    signature: postTextSignature(data, settings, dateIso, mode),
    info: {
      dateLabel,
      firstMatch: first ? matchLine(first, mode) : null,
      matchCount: ordered.length,
      mode,
      streamLink,
      streamFromChannel,
      autoDateUsed: settings.autoDate,
    },
  };
}
