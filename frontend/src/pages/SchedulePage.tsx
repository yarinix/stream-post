import { useCallback, useEffect, useState } from "react";

import ExportButtons from "../features/schedule/components/ExportButtons";
import LogosEditor from "../features/schedule/components/LogosEditor";
import MatchesEditor from "../features/schedule/components/MatchesEditor";
import PostTextEditor from "../features/schedule/components/PostTextEditor";
import ScheduleForm from "../features/schedule/components/ScheduleForm";
import SchedulePreview from "../features/schedule/components/SchedulePreview";
import { CANVAS_PRESETS } from "../features/schedule/constants";
import { createDefaultSchedule } from "../features/schedule/defaults";
import { usePostTextSettings } from "../features/schedule/hooks/usePostTextSettings";
import { useScheduleImage } from "../features/schedule/hooks/useScheduleImage";
import { useTeamLogos } from "../features/schedule/hooks/useTeamLogos";
import { loadSchedule, saveSchedule } from "../features/schedule/storage";
import type { Match, ScheduleData } from "../features/schedule/types";
import "../features/schedule/schedule.css";

export type ScheduleTab = "edit" | "logos" | "preview" | "text";

interface SchedulePageProps {
  initialTab?: ScheduleTab;
}

export default function SchedulePage({ initialTab = "edit" }: SchedulePageProps) {
  const [data, setData] = useState<ScheduleData>(() => loadSchedule() ?? createDefaultSchedule());
  const [tab, setTab] = useState<ScheduleTab>(initialTab);
  const [saved, setSaved] = useState(false);
  const { logos, ready, error, setError, add, remove, rename, replace } = useTeamLogos();
  const { settings, patch: patchSettings } = usePostTextSettings();
  const image = useScheduleImage(data, logos);

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

  function handleReset() {
    if (window.confirm("Сбросить поля к примеру? Логотипы останутся в библиотеке.")) {
      setData(createDefaultSchedule());
    }
  }

  const filename = `mlbb-${data.date || "post"}.png`;

  return (
    <main className="schedule-page">
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

      <div className="schedule-head">
        <span className="eyebrow">MLBB · КАРТИНКА ДЛЯ TELEGRAM</span>
        <h1 className="schedule-page__title">Расписание матчей</h1>
        <p className="schedule-page__subtitle">
          Меняйте данные пальцем — картинка и текст поста обновляются сами. Черновик, логотипы и ссылка
          на стрим сохраняются на устройстве.
        </p>
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
            <MatchesEditor matches={data.matches} logos={logos} onChange={setMatches} />
          </div>

          <div className="col-edit__section" data-section="text">
            <PostTextEditor data={data} settings={settings} onSettingsChange={patchSettings} />
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
            <span className="preview-head__title">Готовый пост</span>
            <span className="preview-head__meta">{CANVAS_PRESETS[data.preset].hint} · PNG</span>
          </div>
          <SchedulePreview image={image} preset={data.preset} />
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
