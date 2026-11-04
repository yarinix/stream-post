import type { Match, ScheduleData } from "./types";

let idCounter = 0;

export function newMatchId(): string {
  idCounter += 1;
  return `m${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function createMatch(partial: Partial<Omit<Match, "id">> = {}): Match {
  return {
    id: newMatchId(),
    teamA: "",
    teamB: "",
    time: "18:00",
    format: "BO3",
    ...partial,
  };
}

/** Прибавляет часы к времени HH:MM (по кругу суток). Для подсказки времени следующего матча. */
export function addHours(time: string, hours: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return "18:00";
  const total = (Number(match[1]) * 60 + Number(match[2]) + hours * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createDefaultSchedule(): ScheduleData {
  return {
    tournament: "MLBB Tournament",
    stage: "Групповой этап · День 1",
    date: todayIso(),
    timezone: "МСК",
    channel: "twitch.tv/your_channel",
    preset: "post",
    theme: "violet",
    matches: [
      createMatch({ time: "18:00", teamA: "Team Alpha", teamB: "Team Bravo", format: "BO3" }),
      createMatch({ time: "20:00", teamA: "Team Charlie", teamB: "Team Delta", format: "BO3" }),
      createMatch({ time: "22:00", teamA: "Team Echo", teamB: "Team Foxtrot", format: "BO5" }),
    ],
  };
}
