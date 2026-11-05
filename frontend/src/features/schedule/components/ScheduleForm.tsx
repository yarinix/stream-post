import { useState } from "react";

import Field from "../../../components/Field";
import { CANVAS_PRESETS, PRESET_IDS, THEMES, THEME_IDS, TIMEZONE_SUGGESTIONS } from "../constants";
import type { ScheduleData } from "../types";

interface ScheduleFormProps {
  data: ScheduleData;
  onChange: (patch: Partial<ScheduleData>) => void;
}

export default function ScheduleForm({ data, onChange }: ScheduleFormProps) {
  // На телефоне «Основное» свёрнуто, чтобы сразу были видны матчи — их правят чаще всего.
  const [open, setOpen] = useState(() => typeof window === "undefined" || window.innerWidth > 900);

  return (
    <details
      className="panel panel--accordion"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="panel__summary">
        <span className="panel__title">Основное</span>
        <span className="panel__summary-hint">турнир, дата, оформление</span>
        <span className="panel__chevron" aria-hidden="true">
          ⌄
        </span>
      </summary>

      <div className="panel__body">
        <Field label="Название турнира">
          <input
            className="input"
            value={data.tournament}
            maxLength={60}
            placeholder="Например, MPL ID Season 17"
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => onChange({ tournament: event.target.value })}
          />
        </Field>

        <Field label="Стадия" hint="Необязательно. Например: Групповой этап · День 1">
          <input
            className="input"
            value={data.stage}
            maxLength={60}
            placeholder="Групповой этап · День 1"
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => onChange({ stage: event.target.value })}
          />
        </Field>

        <div className="field-row">
          <Field label="Дата">
            <input
              className="input"
              type="date"
              value={data.date}
              onChange={(event) => onChange({ date: event.target.value })}
            />
          </Field>

          <Field label="Часовой пояс">
            <input
              className="input"
              list="timezone-suggestions"
              value={data.timezone}
              maxLength={20}
              placeholder="МСК"
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => onChange({ timezone: event.target.value })}
            />
            <datalist id="timezone-suggestions">
              {TIMEZONE_SUGGESTIONS.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="Ссылка на стрим" hint="Для текста поста и картинки расписания. Оставьте пустой, чтобы скрыть.">
          <input
            className="input"
            value={data.channel}
            maxLength={50}
            placeholder="twitch.tv/your_channel"
            autoCapitalize="none"
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => onChange({ channel: event.target.value })}
          />
        </Field>

        <Field label="Telegram-канал" hint="Иконка и ссылка внизу постера «Итоги дня». Оставьте пустым, чтобы скрыть.">
          <input
            className="input"
            value={data.telegramChannel}
            maxLength={50}
            placeholder="t.me/your_channel"
            autoCapitalize="none"
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => onChange({ telegramChannel: event.target.value })}
          />
        </Field>

        <Field label="Размер картинки" group>
          <div className="chips">
            {PRESET_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip${data.preset === id ? " chip--active" : ""}`}
                aria-pressed={data.preset === id}
                onClick={() => onChange({ preset: id })}
              >
                <span>{CANVAS_PRESETS[id].label}</span>
                <small>{CANVAS_PRESETS[id].hint}</small>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Цвет поста" group>
          <div className="swatches">
            {THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`swatch${data.theme === id ? " swatch--active" : ""}`}
                style={{ background: THEMES[id].accent }}
                aria-label={THEMES[id].label}
                aria-pressed={data.theme === id}
                onClick={() => onChange({ theme: id })}
              />
            ))}
          </div>
        </Field>
      </div>
    </details>
  );
}
