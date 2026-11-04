export const FONT_FAMILY =
  '"Montserrat", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const FONT_WEIGHTS = [500, 700, 800, 900];
const SAMPLE_TEXT = "АБВабв ABCabc 0123456789";

let fontsPromise: Promise<void> | null = null;

/**
 * Загружает шрифт Montserrat (подключён в index.html) до отрисовки на canvas.
 * Если шрифт не загрузился за 3 секунды — рисуем запасным системным.
 */
export function ensureFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;

  const load = async (): Promise<void> => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    await Promise.all(
      FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 40px "Montserrat"`, SAMPLE_TEXT)),
    );
  };

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  fontsPromise = Promise.race([load().catch(() => undefined), timeout]);
  return fontsPromise;
}
