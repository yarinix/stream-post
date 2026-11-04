import { useCallback, useEffect, useState } from "react";

import ExportButtons from "../features/schedule/components/ExportButtons";
import MatchesEditor from "../features/schedule/components/MatchesEditor";
import SchedulePreview from "../features/schedule/components/SchedulePreview";
import ScheduleForm from "../features/schedule/components/ScheduleForm";
import { createDefaultSchedule } from "../features/schedule/defaults";
import { useScheduleImage } from "../features/schedule/hooks/useScheduleImage";
import { loadSchedule, saveSchedule } from "../features/schedule/storage";
import type { Match, ScheduleData } from "../features/schedule/types";
import "../features/schedule/schedule.css";

type Tab = "edit" | "preview";

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleData>(() => loadSchedule() ?? createDefaultSchedule());
  const [tab, setTab] = useState<Tab>("edit");
  const image = useScheduleImage(data);

  useEffect(() => {
    saveSchedule(data);
  }, [data]);

  const patch = useCallback((changes: Partial<ScheduleData>) => {
    setData((current) => ({ ...current, ...changes }));
  }, []);

  const setMatches = useCallback((matches: Match[]) => patch({ matches }), [patch]);

  function handleReset() {
    if (window.confirm("Сбросить все поля к примеру? Текущий черновик будет потерян.")) {
      setData(createDefaultSchedule());
    }
  }

  const filename = `schedule-${data.date || "post"}.png`;

  return (
    <main className="schedule-page">
      <header className="topbar">
        <a className="back-link" href="#/">
          ← На главную
        </a>
        <button type="button" className="btn btn--ghost" onClick={handleReset}>
          Сбросить
        </button>
      </header>

      <h1 className="schedule-page__title">Расписание матчей</h1>
      <p className="schedule-page__subtitle">
        Заполните данные — картинка для Telegram обновляется сразу. Черновик сохраняется в браузере.
      </p>

      <div className="tabs" role="tablist" aria-label="Режим">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "edit"}
          className={`tabs__item${tab === "edit" ? " tabs__item--active" : ""}`}
          onClick={() => setTab("edit")}
        >
          Редактор
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          className={`tabs__item${tab === "preview" ? " tabs__item--active" : ""}`}
          onClick={() => setTab("preview")}
        >
          Картинка
        </button>
      </div>

      <div className="schedule-layout" data-tab={tab}>
        <div className="col-edit">
          <ScheduleForm data={data} onChange={patch} />
          <MatchesEditor matches={data.matches} onChange={setMatches} />
        </div>

        <div className="col-preview">
          <SchedulePreview image={image} preset={data.preset} />
          <ExportButtons blob={image.blob} filename={filename} />
        </div>
      </div>
    </main>
  );
}
