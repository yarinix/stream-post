import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { findTeamLogo } from "../logos/types";
import type { TeamLogo } from "../logos/types";
import type { Match } from "../types";

interface LogosEditorProps {
  logos: TeamLogo[];
  matches: Match[];
  ready: boolean;
  onAdd: (name: string, file: File) => Promise<TeamLogo>;
  onRemove: (id: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onReplace: (id: string, file: File) => Promise<unknown>;
}

interface LogoCardProps {
  logo: TeamLogo;
  used: number;
  onRename: (id: string, name: string) => Promise<unknown>;
  onReplace: (id: string, file: File) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}

function LogoCard({ logo, used, onRename, onReplace, onRemove }: LogoCardProps) {
  const [name, setName] = useState(logo.name);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(logo.name), [logo.name]);

  async function commitName() {
    const next = name.trim();
    if (!next || next === logo.name) {
      setName(logo.name);
      return;
    }
    try {
      await onRename(logo.id, next);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось переименовать");
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      await onReplace(logo.id, file);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось заменить логотип");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemove() {
    if (!window.confirm(`Удалить логотип «${logo.name}»?`)) return;
    try {
      await onRemove(logo.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить логотип");
    }
  }

  return (
    <li className="logo-card">
      <div className="logo-card__top">
        <img className="logo-card__img" src={logo.dataUrl} alt={`Логотип ${logo.name}`} />
        <div className="logo-card__meta">
          <input
            className="input input--sm"
            value={name}
            aria-label="Название команды для логотипа"
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
          <span className="logo-card__usage">
            {used > 0 ? `Используется в ${used} матч(ах)` : "Не используется в матчах"}
          </span>
        </div>
      </div>
      <div className="logo-card__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
          Заменить
        </button>
        <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={handleRemove}>
          Удалить
        </button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          aria-label="Выбрать новый файл логотипа"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
    </li>
  );
}

export default function LogosEditor({
  logos,
  matches,
  ready,
  onAdd,
  onRemove,
  onRename,
  onReplace,
}: LogosEditorProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    matches.forEach((match) => {
      ([
        [match.teamA, match.logoA],
        [match.teamB, match.logoB],
      ] as const).forEach(([team, explicitId]) => {
        const logo = findTeamLogo(logos, team, explicitId);
        if (logo) counts.set(logo.id, (counts.get(logo.id) ?? 0) + 1);
      });
    });
    return counts;
  }, [logos, matches]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Укажите название команды — так логотип найдётся в матчах.");
      return;
    }
    if (!file) {
      setError("Выберите файл с логотипом.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await onAdd(name.trim(), file);
      setMessage(`Логотип «${name.trim()}» сохранён на устройстве.`);
      setName("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить логотип");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">Логотипы команд</h2>
        <span className="panel__counter">{logos.length} / 40</span>
      </div>
      <p className="panel__hint">
        Логотипы сохраняются в браузере и остаются после перезагрузки. Если название команды в матче
        совпадает с названием логотипа — он подставится на картинку автоматически. Лучше всего подходят
        PNG с прозрачным фоном (эмблемы команд MLBB).
      </p>

      <form className="logo-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Название команды</span>
          <input
            className="input"
            value={name}
            maxLength={40}
            placeholder="Например, Team Alpha"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="logo-picker">
          <input
            ref={fileRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="logo-picker__frame">
            {preview ? <img src={preview} alt="Предпросмотр выбранного логотипа" /> : <span>+</span>}
          </span>
          <span className="logo-picker__text">
            <strong>{file ? file.name : "Выбрать логотип"}</strong>
            <small>Нажмите, чтобы выбрать фото из галереи телефона</small>
          </span>
        </label>

        <button type="submit" className="btn btn--block" disabled={busy || !file || !name.trim()}>
          {busy ? "Сохраняем…" : "Сохранить логотип"}
        </button>
      </form>

      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className="inline-ok">{message}</p> : null}

      <h3 className="panel__subtitle">Сохранённые логотипы</h3>
      {!ready ? (
        <p className="panel__empty">Загружаем…</p>
      ) : logos.length === 0 ? (
        <p className="panel__empty">
          Пока пусто. Загрузите эмблему первой команды — она появится на картинке с расписанием.
        </p>
      ) : (
        <ul className="logo-grid">
          {logos.map((logo) => (
            <LogoCard
              key={logo.id}
              logo={logo}
              used={usage.get(logo.id) ?? 0}
              onRename={onRename}
              onReplace={onReplace}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
