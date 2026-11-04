import { findTeamLogo } from "../logos/types";
import type { TeamLogo } from "../logos/types";
import { MATCH_FORMATS, MAX_MATCHES } from "../constants";
import { addHours, createMatch } from "../defaults";
import type { Match, MatchFormat } from "../types";

interface MatchesEditorProps {
  matches: Match[];
  logos: TeamLogo[];
  onChange: (matches: Match[]) => void;
}

interface LogoPickerProps {
  label: string;
  teamName: string;
  value: string | null | undefined;
  logos: TeamLogo[];
  onChange: (id: string | null) => void;
}

function LogoPicker({ label, teamName, value, logos, onChange }: LogoPickerProps) {
  const found = findTeamLogo(logos, teamName, value);
  return (
    <label className="logo-pick">
      <span className="logo-pick__label">{label}</span>
      <span className="logo-pick__row">
        <span className="logo-pick__thumb">
          {found ? <img src={found.dataUrl} alt="" /> : <span>—</span>}
        </span>
        <select
          className="input input--sm"
          value={value ?? ""}
          aria-label={`Логотип: ${label}`}
          onChange={(event) => onChange(event.target.value || null)}
        >
          <option value="">Авто по названию</option>
          {logos.map((logo) => (
            <option key={logo.id} value={logo.id}>
              {logo.name}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

export default function MatchesEditor({ matches, logos, onChange }: MatchesEditorProps) {
  function updateMatch(id: string, patch: Partial<Match>) {
    onChange(matches.map((match) => (match.id === id ? { ...match, ...patch } : match)));
  }

  function removeMatch(id: string) {
    onChange(matches.filter((match) => match.id !== id));
  }

  function duplicateMatch(index: number) {
    const source = matches[index];
    if (!source || matches.length >= MAX_MATCHES) return;
    const next = [...matches];
    next.splice(
      index + 1,
      0,
      createMatch({
        teamA: source.teamA,
        teamB: source.teamB,
        time: addHours(source.time, 1),
        format: source.format,
        logoA: source.logoA ?? null,
        logoB: source.logoB ?? null,
      }),
    );
    onChange(next);
  }

  function moveMatch(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= matches.length) return;
    const next = [...matches];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addMatch() {
    const last = matches[matches.length - 1];
    onChange([
      ...matches,
      createMatch({
        time: last ? addHours(last.time, 2) : "18:00",
        format: last ? last.format : "BO3",
      }),
    ]);
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">Матчи</h2>
        <span className="panel__counter">
          {matches.length} / {MAX_MATCHES}
        </span>
      </div>

      {matches.length === 0 ? <p className="panel__empty">Матчей пока нет. Добавьте первый.</p> : null}

      <ol className="matches">
        {matches.map((match, index) => (
          <li key={match.id} className="match">
            <div className="match__head">
              <span className="match__number">{index + 1}</span>
              <span className="match__label">Матч {index + 1}</span>

              <div className="match__actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Поднять выше"
                  disabled={index === 0}
                  onClick={() => moveMatch(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Опустить ниже"
                  disabled={index === matches.length - 1}
                  onClick={() => moveMatch(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Дублировать матч"
                  disabled={matches.length >= MAX_MATCHES}
                  onClick={() => duplicateMatch(index)}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label="Удалить матч"
                  onClick={() => removeMatch(match.id)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="match__when">
              <input
                className="input"
                type="time"
                value={match.time}
                aria-label={`Время матча ${index + 1}`}
                onChange={(event) => updateMatch(match.id, { time: event.target.value })}
              />

              <select
                className="input"
                value={match.format}
                aria-label={`Формат матча ${index + 1}`}
                onChange={(event) => updateMatch(match.id, { format: event.target.value as MatchFormat })}
              >
                {MATCH_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <div className="match__teams">
              <input
                className="input"
                value={match.teamA}
                maxLength={30}
                placeholder="Команда 1"
                autoComplete="off"
                enterKeyHint="done"
                aria-label={`Команда 1, матч ${index + 1}`}
                onChange={(event) => updateMatch(match.id, { teamA: event.target.value })}
              />
              <span className="match__vs">VS</span>
              <input
                className="input"
                value={match.teamB}
                maxLength={30}
                placeholder="Команда 2"
                autoComplete="off"
                enterKeyHint="done"
                aria-label={`Команда 2, матч ${index + 1}`}
                onChange={(event) => updateMatch(match.id, { teamB: event.target.value })}
              />
            </div>

            <div className="match__logos">
              <LogoPicker
                label="Логотип 1"
                teamName={match.teamA}
                value={match.logoA}
                logos={logos}
                onChange={(id) => updateMatch(match.id, { logoA: id })}
              />
              <LogoPicker
                label="Логотип 2"
                teamName={match.teamB}
                value={match.logoB}
                logos={logos}
                onChange={(id) => updateMatch(match.id, { logoB: id })}
              />
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="btn btn--secondary btn--block"
        disabled={matches.length >= MAX_MATCHES}
        onClick={addMatch}
      >
        + Добавить матч
      </button>
    </section>
  );
}
