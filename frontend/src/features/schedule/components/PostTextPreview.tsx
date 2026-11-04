interface PostTextPreviewProps {
  /** Тот же plain-текст, что копируется в Telegram. */
  text: string;
}

type LineKind =
  | "blank"
  | "rule"
  | "title"
  | "section"
  | "meta"
  | "match"
  | "link"
  | "outro"
  | "text";

function kindOf(line: string): LineKind {
  const t = line.trim();
  if (!t) return "blank";
  if (/^[━─═]{6,}$/.test(t)) return "rule";
  if (t.startsWith("🏆")) return "title";
  if (t === "РАСПИСАНИЕ МАТЧЕЙ" || t.startsWith("📺")) return "section";
  if (t.startsWith("⚔") || t.startsWith("📅")) return "meta";
  if (/^\d{1,2}:\d{2}/.test(t)) return "match";
  if (/^https?:\/\//i.test(t)) return "link";
  if (t.startsWith("🔥")) return "outro";
  return "text";
}

/**
 * Визуальное превью подписи в стиле карточки сообщения Telegram.
 * Ничего не меняет в самом тексте — копируется исходный plain-text.
 */
export default function PostTextPreview({ text }: PostTextPreviewProps) {
  return (
    <div className="post-preview" aria-label="Предпросмотр текста поста">
      <div className="post-preview__inner">
        {text.split("\n").map((line, index) => {
          const kind = kindOf(line);
          const t = line.trim();
          switch (kind) {
            case "blank":
              return <div className="post-preview__gap" key={index} aria-hidden="true" />;
            case "rule":
              return <div className="post-preview__rule" key={index} aria-hidden="true" />;
            case "title":
              return (
                <p className="post-preview__title" key={index}>
                  {t}
                </p>
              );
            case "section":
              return (
                <p className="post-preview__section" key={index}>
                  {t}
                </p>
              );
            case "meta":
              return (
                <p className="post-preview__meta" key={index}>
                  {t}
                </p>
              );
            case "link":
              return (
                <a
                  className="post-preview__link"
                  key={index}
                  href={t}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t}
                </a>
              );
            case "outro":
              return (
                <p className="post-preview__outro" key={index}>
                  {t}
                </p>
              );
            case "match": {
              // Время отделяем от команд, ведущий тире в «18:00 — A vs B» убираем.
              const parts = /^(\d{1,2}:\d{2})\s*[—–-]?\s*(.*)$/.exec(t);
              return parts ? (
                <p className="post-preview__match" key={index}>
                  <span className="post-preview__time">{parts[1]}</span>
                  <span>{parts[2]}</span>
                </p>
              ) : (
                <p className="post-preview__text" key={index}>
                  {t}
                </p>
              );
            }
            default:
              return (
                <p className="post-preview__text" key={index}>
                  {t}
                </p>
              );
          }
        })}
      </div>
    </div>
  );
}
