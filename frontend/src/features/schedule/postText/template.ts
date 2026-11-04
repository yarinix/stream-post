import { todayIso } from "../defaults";
import { formatDateRu } from "../format";
import type { Match, ScheduleData } from "../types";
import type { PostTextSettings } from "./settings";

/** Шаблон подписи к фотографии. Плейсхолдеры заполняются из данных формы. */
export const POST_TEMPLATE = `🏆 {{TOURNAMENT_NAME}}
{{STAGE}} · {{DATE}}

Сегодня нас ждут следующие противостояния:

{{MATCH_LIST}}

📺 Трансляция: {{STREAM_LINK}}

Подключайтесь, будет интересно! 🔥`;

interface TemplateVars {
  tournament: string;
  stage: string;
  date: string;
  matchList: string;
  streamLink: string;
}

export function renderPostTemplate(vars: TemplateVars): string {
  const header = vars.stage ? `${vars.stage} · ${vars.date}` : vars.date;
  return POST_TEMPLATE
    // Функция в replace — чтобы символы вроде "$&" в названии турнира не трактовались как шаблон.
    .replace("{{STAGE}} · {{DATE}}", () => header)
    .replace("{{TOURNAMENT_NAME}}", () => vars.tournament)
    .replace("{{MATCH_LIST}}", () => vars.matchList)
    .replace("{{STREAM_LINK}}", () => vars.streamLink);
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

export function matchLine(match: Match): string {
  const teamA = match.teamA.trim() || "TBD";
  const teamB = match.teamB.trim() || "TBD";
  return `${normalizeTime(match.time)} — ${teamA} vs ${teamB} (${match.format})`;
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
): string {
  return JSON.stringify({
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
    ]),
  });
}

export function buildPostText(
  data: ScheduleData,
  settings: PostTextSettings,
): PostTextResult {
  const dateIso = settings.autoDate ? todayIso() : data.date;
  const readableDate = formatDateRu(dateIso) || formatDateRu(todayIso()) || dateIso;
  const dateLabel =
    settings.includeTimezone && data.timezone.trim()
      ? `${readableDate} · ${data.timezone.trim()}`
      : readableDate;

  const filled = data.matches.filter(hasTeams);
  const ordered = settings.sortByTime ? sortMatchesByTime(filled) : filled;
  const matchList = ordered.length ? ordered.map(matchLine).join("\n") : "—";

  const streamFromChannel = !settings.streamLink.trim() && Boolean(data.channel.trim());
  const streamLink = settings.streamLink.trim() || data.channel.trim() || "ссылка не указана";

  const first = findFirstMatch(data.matches);
  const text = renderPostTemplate({
    tournament: data.tournament.trim() || "Турнир",
    stage: data.stage.trim(),
    date: dateLabel,
    matchList,
    streamLink,
  });

  return {
    text,
    signature: postTextSignature(data, settings, dateIso),
    info: {
      dateLabel,
      firstMatch: first ? matchLine(first) : null,
      matchCount: ordered.length,
      streamLink,
      streamFromChannel,
      autoDateUsed: settings.autoDate,
    },
  };
}
