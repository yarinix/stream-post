import { useEffect, useRef, useState } from "react";

import { ensureFonts } from "../fonts";
import { loadLogoImages } from "../logos/image";
import type { TeamLogo } from "../logos/types";
import { canvasToBlob } from "../render/exportImage";
import { renderSchedule } from "../render/renderSchedule";
import type { ScheduleData } from "../types";

export interface ScheduleImage {
  url: string | null;
  blob: Blob | null;
  busy: boolean;
  error: string | null;
}

const RENDER_DELAY_MS = 200;

/** Перерисовывает картинку при изменении данных или библиотеки логотипов. */
export function useScheduleImage(data: ScheduleData, logos: TeamLogo[]): ScheduleImage {
  const [image, setImage] = useState<ScheduleImage>({ url: null, blob: null, busy: true, error: null });
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setImage((prev) => ({ ...prev, busy: true }));

    const timer = window.setTimeout(async () => {
      try {
        const [, renderLogos] = await Promise.all([ensureFonts(), loadLogoImages(logos)]);
        if (cancelled) return;
        const blob = await canvasToBlob(renderSchedule(data, renderLogos));
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = url;
        setImage({ url, blob, busy: false, error: null });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Не удалось создать картинку";
        setImage((prev) => ({ ...prev, busy: false, error: message }));
      }
    }, RENDER_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data, logos]);

  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    };
  }, []);

  return image;
}
