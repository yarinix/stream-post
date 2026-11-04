import Field from "../../../components/Field";
import { CANVAS_PRESETS, PRESET_IDS, THEMES, THEME_IDS, TIMEZONE_SUGGESTIONS } from "../constants";
import type { ScheduleData } from "../types";

interface ScheduleFormProps {
  data: ScheduleData;
  onChange: (patch: Partial<ScheduleData>) => void;
}

export default function ScheduleForm({ data, onChange }: ScheduleFormProps) {
  return (
    <section className="panel">
      <h2 className="panel__title">Основное</h2>

      <Field label="Название турнира">
        <input
          className="input"
          value={data.tournament}
          maxLength={60}
          placeholder="Например, MPL ID Season 17"
          onChange={(event) => onChange({ tournament: event.target.value })}
        />
      </Field>

      <Field label="Стадия" hint="Необязательно. Например: Групповой этап · День 1">
        <input
          className="input"
          value={data.stage}
          maxLength={60}
          placeholder="Групповой этап · День 1"
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
            onChange={(event) => onChange({ timezone: event.target.value })}
          />
          <datalist id="timezone-suggestions">
            {TIMEZONE_SUGGESTIONS.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Канал внизу картинки" hint="Необязательно. Оставьте пустым, чтобы скрыть.">
        <input
          className="input"
          value={data.channel}
          maxLength={50}
          placeholder="twitch.tv/your_channel"
          autoCapitalize="none"
          onChange={(event) => onChange({ channel: event.target.value })}
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

      <Field label="Цвет" group>
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
    </section>
  );
}
