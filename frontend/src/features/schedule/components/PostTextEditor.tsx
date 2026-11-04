import { useState } from "react";

import Field from "../../../components/Field";
import { pluralRu } from "../format";
import { usePostText } from "../hooks/usePostText";
import { copyToClipboard } from "../postText/clipboard";
import type { PostTextSettings } from "../postText/settings";
import type { ScheduleData } from "../types";
import PostTextPreview from "./PostTextPreview";

/** Лимит подписи к фотографии в Telegram. */
const CAPTION_LIMIT = 1024;

interface PostTextEditorProps {
  data: ScheduleData;
  settings: PostTextSettings;
  onSettingsChange: (patch: Partial<PostTextSettings>) => void;
}

interface SwitchProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Switch({ label, hint, checked, onChange }: SwitchProps) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__text">
        <span>{label}</span>
        <small>{hint}</small>
      </span>
    </label>
  );
}

export default function PostTextEditor({
  data,
  settings,
  onSettingsChange,
}: PostTextEditorProps) {
  const { text, info, edited, outdated, setText, regenerate } = usePostText(data, settings);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [view, setView] = useState<"edit" | "preview">("edit");
  // Если ссылка ещё не задана — сразу показываем настройки, чтобы её было видно.
  const [settingsOpen, setSettingsOpen] = useState(() => !settings.streamLink.trim());
  const overLimit = text.length > CAPTION_LIMIT;

  async function handleCopy() {
    setStatus("idle");
    const ok = await copyToClipboard(text);
    setStatus(ok ? "copied" : "error");
    if (ok) window.setTimeout(() => setStatus("idle"), 2600);
  }

  return (
    <section className="panel post-text">
      <div className="panel__head">
        <h2 className="panel__title">Текст поста</h2>
        <span className="panel__counter">
          {info.matchCount} {pluralRu(info.matchCount, "матч", "матча", "матчей")}
        </span>
      </div>
      <p className="panel__hint">
        Собирается из введённых данных по шаблону. Перед копированием можно поправить любую строку —
        или посмотреть, как пост будет выглядеть в Telegram, на вкладке «Превью».
      </p>

      <div className="post-text__facts">
        <span className="fact">
          📅 {info.autoDateUsed ? "Сегодня: " : "Дата: "}
          {info.dateLabel}
        </span>
        <span className="fact">🥇 Первый матч: {info.firstMatch ?? "не задан"}</span>
        {info.streamFromChannel ? (
          <span className="fact">📺 Ссылка взята из поля «Канал внизу картинки»</span>
        ) : null}
      </div>

      {outdated ? (
        <div className="post-text__notice" role="status">
          <span>Данные изменились, но текст правлен вручную — сейчас показывается ваша версия.</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={regenerate}>
            Собрать заново
          </button>
        </div>
      ) : null}

      <div className="post-text__field">
        <div className="post-text__tabs" role="tablist" aria-label="Режим отображения текста">
          <button
            type="button"
            role="tab"
            aria-selected={view === "edit"}
            className={`post-text__tab${view === "edit" ? " post-text__tab--active" : ""}`}
            onClick={() => setView("edit")}
          >
            ✎ Правка
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "preview"}
            className={`post-text__tab${view === "preview" ? " post-text__tab--active" : ""}`}
            onClick={() => setView("preview")}
          >
            ◉ Превью
          </button>
        </div>

        {view === "edit" ? (
          <label className="field">
            <span className="field__label">Итоговый текст</span>
            <textarea
              className="input post-text__area"
              value={text}
              rows={18}
              spellCheck={false}
              aria-label="Итоговый текст поста"
              onChange={(event) => {
                setText(event.target.value);
                setStatus("idle");
              }}
            />
          </label>
        ) : (
          <>
            <span className="field__label">Так пост выглядит в Telegram</span>
            <PostTextPreview text={text} />
          </>
        )}
      </div>

      <p className={`post-text__meta${overLimit ? " post-text__meta--over" : ""}`} role="status">
        {text.length} / {CAPTION_LIMIT}
        <span>
          {overLimit
            ? " · Telegram обрежет подпись к фото"
            : " · лимит подписи к фото в Telegram"}
        </span>
      </p>

      <div className="post-text__actions">
        <button type="button" className="btn btn--block" onClick={handleCopy}>
          Скопировать текст
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--block"
          disabled={!edited}
          onClick={() => {
            regenerate();
            setStatus("idle");
          }}
        >
          Собрать заново
        </button>
      </div>

      {status === "copied" ? (
        <p className="inline-ok" role="status">
          ✓ Скопировано — вставляйте в Telegram вместе с картинкой.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="inline-error" role="alert">
          Не получилось скопировать автоматически. Выделите текст в поле и скопируйте вручную.
        </p>
      ) : null}

      <details
        className="panel panel--accordion post-text__settings"
        open={settingsOpen}
        onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
      >
        <summary className="panel__summary">
          <span className="panel__title">Настройки текста</span>
          <span className="panel__summary-hint">ссылка на стрим, дата, матчи</span>
          <span className="panel__chevron" aria-hidden="true">
            ⌄
          </span>
        </summary>

        <div className="panel__body">
          <Field
            label="Ссылка на стрим"
            hint="Сохраняется на устройстве и подставляется во все посты. Если оставить пустым — возьмём канал из «Основного»."
          >
            <input
              className="input"
              value={settings.streamLink}
              maxLength={300}
              placeholder="https://twitch.tv/your_channel"
              autoCapitalize="none"
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => onSettingsChange({ streamLink: event.target.value })}
            />
          </Field>

          <Switch
            label="Автоматическая подстановка даты"
            hint="Сегодняшняя дата вместо даты из черновика"
            checked={settings.autoDate}
            onChange={(autoDate) => onSettingsChange({ autoDate })}
          />
          <Switch
            label="Сортировать матчи по времени"
            hint="В списке текста первым идёт самый ранний матч — порядок карточек при этом не меняется"
            checked={settings.sortByTime}
            onChange={(sortByTime) => onSettingsChange({ sortByTime })}
          />
          <Switch
            label="Часовой пояс в дате"
            hint="Добавляет «· МСК» к дате в шапке текста"
            checked={settings.includeTimezone}
            onChange={(includeTimezone) => onSettingsChange({ includeTimezone })}
          />
        </div>
      </details>
    </section>
  );
}
