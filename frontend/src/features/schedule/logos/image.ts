import type { RenderLogo, TeamLogo } from "./types";

/** Исходный файл не должен быть огромным — всё равно ужимаем до 320 px. */
export const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const LOGO_SIZE = 320;

export function newLogoId(): string {
  return `logo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    image.src = src;
  });
}

/** Читает файл, ужимает до квадрата 320 px и возвращает PNG с прозрачностью. */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Нужен файл-изображение (PNG, JPG, WEBP, SVG).");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Файл больше 8 МБ — выберите изображение поменьше.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const source = await loadImage(objectUrl);
    const scale = Math.min(1, LOGO_SIZE / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SIZE;
    canvas.height = LOGO_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas не поддерживается в этом браузере");

    // Логотип центрируем в квадрате, сохраняя пропорции и прозрачный фон.
    ctx.drawImage(source, (LOGO_SIZE - width) / 2, (LOGO_SIZE - height) / 2, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Кэш по id+updatedAt: при каждом нажатии клавиши не пересоздаём Image заново.
const imageCache = new Map<string, HTMLImageElement>();

/** Готовит логотипы к отрисовке на canvas. Битые картинки просто пропускаются. */
export async function loadLogoImages(logos: TeamLogo[]): Promise<RenderLogo[]> {
  const loaded = await Promise.all(
    logos.map(async (logo): Promise<RenderLogo | null> => {
      const key = `${logo.id}:${logo.updatedAt}`;
      let image = imageCache.get(key);
      if (!image) {
        try {
          image = await loadImage(logo.dataUrl);
        } catch {
          return null;
        }
        imageCache.set(key, image);
      }
      return { id: logo.id, name: logo.name, image };
    }),
  );
  return loaded.filter((item): item is RenderLogo => item !== null);
}
