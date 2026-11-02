import { useEffect, useState } from "react";

import { fetchHealth, type HealthResponse } from "../api/health";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error" };

const DATABASE_LABELS: Record<HealthResponse["database"], string> = {
  not_configured: "не подключена (пока не нужна)",
  connected: "подключена",
  unavailable: "недоступна",
};

export default function BackendStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((data) => !cancelled && setState({ kind: "ok", data }))
      .catch(() => !cancelled && setState({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="status status--loading">
        Проверяем связь с сервером… (бесплатный сервер на Render может
        просыпаться до минуты)
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="status status--error">
        Сервер недоступен. Проверьте, что backend запущен.
      </div>
    );
  }

  const { data } = state;
  return (
    <div className="status status--ok">
      <div className="status__title">Сервер работает</div>
      <dl className="status__list">
        <dt>Сервис</dt>
        <dd>{data.service}</dd>
        <dt>Версия</dt>
        <dd>{data.version}</dd>
        <dt>Среда</dt>
        <dd>{data.environment}</dd>
        <dt>База данных</dt>
        <dd>{DATABASE_LABELS[data.database]}</dd>
      </dl>
    </div>
  );
}
