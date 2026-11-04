import { CANVAS_PRESETS } from "../constants";
import type { ScheduleImage } from "../hooks/useScheduleImage";
import type { CanvasPresetId } from "../types";

interface SchedulePreviewProps {
  image: ScheduleImage;
  preset: CanvasPresetId;
}

export default function SchedulePreview({ image, preset }: SchedulePreviewProps) {
  const { width, height } = CANVAS_PRESETS[preset];

  return (
    <div className="preview" style={{ aspectRatio: `${width} / ${height}` }}>
      {image.url ? (
        // Обычный <img>: на iPhone по нему можно долго нажать и выбрать «Сохранить в Фото».
        <img
          className={`preview__img${image.busy ? " preview__img--busy" : ""}`}
          src={image.url}
          alt="Предпросмотр картинки с расписанием"
        />
      ) : (
        <div className="preview__placeholder">{image.error ?? "Готовим картинку…"}</div>
      )}
      {image.error && image.url ? <div className="preview__error">{image.error}</div> : null}
    </div>
  );
}
