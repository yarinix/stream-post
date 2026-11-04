import { useState } from "react";

import { canShareFile, downloadBlob, shareBlob } from "../render/exportImage";

interface ExportButtonsProps {
  blob: Blob | null;
  filename: string;
}

export default function ExportButtons({ blob, filename }: ExportButtonsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const shareAvailable = canShareFile(blob, filename);

  async function handleShare() {
    if (!blob) return;
    setMessage(null);
    try {
      await shareBlob(blob, filename);
    } catch {
      setMessage("Не получилось открыть меню «Поделиться». Попробуйте «Скачать PNG».");
    }
  }

  return (
    <div className="export">
      <div className="export__buttons">
        {shareAvailable ? (
          <button type="button" className="btn btn--block" disabled={!blob} onClick={handleShare}>
            Сохранить в Фото / Поделиться
          </button>
        ) : null}
        <button
          type="button"
          className={`btn btn--block${shareAvailable ? " btn--secondary" : ""}`}
          disabled={!blob}
          onClick={() => blob && downloadBlob(blob, filename)}
        >
          Скачать PNG
        </button>
      </div>
      {message ? (
        <p className="export__message" role="status">
          {message}
        </p>
      ) : null}
      <p className="export__hint">
        Сохраните фото и прикрепите его к посту в Telegram — пока проект делает только картинки.
        На iPhone можно также удерживать палец на картинке и выбрать «Сохранить в Фото».
      </p>
    </div>
  );
}
