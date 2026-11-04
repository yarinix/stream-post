import { useCallback, useEffect, useState } from "react";

import ExportButtons from "../features/schedule/components/ExportButtons";
import LogosEditor from "../features/schedule/components/LogosEditor";
import MatchesEditor from "../features/schedule/components/MatchesEditor";
import PostTextEditor from "../features/schedule/components/PostTextEditor";
import ScheduleForm from "../features/schedule/components/ScheduleForm";
import SchedulePreview from "../features/schedule/components/SchedulePreview";
import { CANVAS_PRESETS, POST_MODES, POST_MODE_IDS } from "../features/schedule/constants";
import { createDefaultSchedule } from "../features/schedule/defaults";
import { usePostTextSettings } from "../features/schedule/hooks/usePostTextSettings";
import { useScheduleImage } from "../features/schedule/hooks/useScheduleImage";
import { useTeamLogos } from "../features/schedule/hooks/useTeamLogos";
import { loadSchedule, saveSchedule } from "../features/schedule/storage";
import type { Match, PostMode, ScheduleData } from "../features/schedule/types";
import "../features/schedule/schedule.css";

export type ScheduleTab = "edit" | "logos" | "preview" | "text";

interface SchedulePageProps {
  initialTab?: ScheduleTab;
  requestedMode?: PostMode;
}

const MODE_ICONS: Record<PostMode, string> = {
  schedule: "▤",
  predict: "🎯",
  results: "🏁",
};

export default function SchedulePage({ initialTab = "edit", requestedMode = "schedule" }: SchedulePageProps) {
  const [data, setData] = useState<ScheduleData>(() => loadSchedule() ?? createDefaultSchedule());
  const [tab, setTab] = useState<ScheduleTab>(initialTab);
  const [mode, setMode] = useState<PostMode>(requestedMode);
  const [saved, setSaved] = useState(false);
  const { logos, ready, error, setError, add, remove, rename, replace } = useTeamLogos();
  const { settings, patch: patchSettings } = usePostTextSettings();
  const image = useScheduleImage(data, logos, mode);
  const modeInfo = POST_MODES[mode];

  // Если режим пришёл из URL (ссылка с главной или закладка) — подхватываем его.
  useEffect(() => setMode(requestedMode), [requestedMode]);

  useEffect(() => {
    saveSchedule(data);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1800);
    return () => window.clearTimeout(timer);
  }, [data]);

  const patch = useCallback((changes: Partial<ScheduleData>) => {
    setData((current) => ({ ...current, ...changes }));
  }, []);

  const setMatches = useCallback((matches: Match[]) => patch({ matches }), [patch]);

  // Обновляем адрес без hashchange: ссылку на нужный режим можно сохранить в закладки,
  // но переключение не перемонтирует страницу и не сбрасывает открытую вкладку.
  const changeMode = useCallback(
    (next: PostMode) => {
      setMode(next);
      const params = new URLSearchParams();
      if (next !== "schedule") params.set("mode", next);
      if (tab !== "edit") params.set("tab", tab);
      const query = params.toString();
      window.history.replaceState(null, "", `#/schedule${query ? `?${query}` : ""}`);
    },
    [tab],
  );

  function handleReset() {
    if (window.confirm("Сбросить поля к примеру? Логотипы останутся в библиотеке.")) {
      setData(createDefaultSchedule());
    }
  }

  const suffix = modeInfo.fileSuffix ? `-${modeInfo.fileSuffix}` : "";
  const filename = `mlbb-${data.date || "post"}${suffix}.png`;

  return (
    <main className="schedule-page" data-mode={mode}>
      <header className="topbar">
        <a className="back-link" href="#/">
          ← На главную
        </a>
        <div className="topbar__right">
          <span className={`save-badge${saved ? " save-badge--visible" : ""}`} aria-live="polite">
            ✓ Сохранено
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleReset}>
            Сбросить
          </button>
        </div>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Тип поста">
        {POST_MODE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`mode-switch__item${mode === id ? " mode-switch__item--active" : ""}`}
            aria-selected={mode === id}
            aria-label={POST_MODES[id].label}
            onClick={() => changeMode(id)}
          >
            <span className="mode-switch__icon" aria-hidden="true">
              {MODE_ICONS[id]}
            </span>
            <span className="mode-switch__label">{POST_MODES[id].short}</span>
          </button>
        ))}
      </div>

      <div className="schedule-head">
        <span className="eyebrow">{modeInfo.eyebrow}</span>
        <h1 className="schedule-page__title">{modeInfo.title}</h1>
        <p className="schedule-page__subtitle">{modeInfo.subtitle}</p>
      </div>

      {error ? (
        <div className="banner banner--error" role="alert">
          <span>{error}</span>
          <button type="button" className="banner__close" aria-label="Закрыть" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      ) : null}

      <div className="schedule-layout" data-tab={tab}>
        <div className="col-edit">
          <div className="col-edit__section" data-section="main">
            <ScheduleForm data={data} onChange={patch} />
            <MatchesEditor matches={data.matches} logos={logos} mode={mode} onChange={setMatches} />
          </div>

          <div className="col-edit__section" data-section="text">
            <PostTextEditor
              data={data}
              settings={settings}
              mode={mode}
              onSettingsChange={patchSettings}
            />
          </div>

          <div className="col-edit__section" data-section="logos">
            <LogosEditor
              logos={logos}
              matches={data.matches}
              ready={ready}
              onAdd={add}
              onRemove={remove}
              onRename={rename}
              onReplace={replace}
            />
          </div>
        </div>

        <div className="col-preview">
          <div className="preview-head">
            <span className="preview-head__title">Готовый пост · {modeInfo.label}</span>
            <span className="preview-head__meta">{CANVAS_PRESETS[data.preset].hint} · PNG</span>
          </div>
          <SchedulePreview image={image} preset={data.preset} label={modeInfo.title} />
          <ExportButtons blob={image.blob} filename={filename} />
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Разделы редактора">
        <button
          type="button"
          className={`bottom-nav__item${tab === "edit" ? " bottom-nav__item--active" : ""}`}
          aria-current={tab === "edit" ? "page" : undefined}
          onClick={() => setTab("edit")}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            ✎
          </span>
          <span>Данные</span>
        </button>
        <button
          type="button"
          className={`bottom-nav__item${tab === "logos" ? " bottom-nav__item--active" : ""}`}
          aria-current={tab === "logos" ? "page" : undefined}
          onClick={() => setTab("logos")}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            ▣
          </span>
          <span>Логотипы</span>
          {logos.length > 0 ? <span className="bottom-nav__badge">{logos.length}</span> : null}
        </button>
        <button
          type="button"
          className={`bottom-nav__item${tab === "preview" ? " bottom-nav__item--active" : ""}`}
          aria-current={tab === "preview" ? "page" : undefined}
          onClick={() => setTab("preview")}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            ▤
          </span>
          <span>Картинка</span>
        </button>
        <button
          type="button"
          className={`bottom-nav__item${tab === "text" ? " bottom-nav__item--active" : ""}`}
          aria-current={tab === "text" ? "page" : undefined}
          onClick={() => setTab("text")}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            ≡
          </span>
          <span>Текст</span>
        </button>
      </nav>
    </main>
  );
}
