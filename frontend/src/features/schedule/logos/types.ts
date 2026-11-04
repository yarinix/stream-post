/** Логотип команды, сохранённый на устройстве пользователя. */
export interface TeamLogo {
  id: string;
  /** Название команды — по нему логотип автоматически подставляется в матчи. */
  name: string;
  /** Сжатое изображение (PNG data URL), чтобы не зависеть от сети и backend. */
  dataUrl: string;
  updatedAt: number;
}

/** Логотип с уже загруженной картинкой, готовый к отрисовке на canvas. */
export interface RenderLogo {
  id: string;
  name: string;
  image: HTMLImageElement;
}

/** Приводит название команды к виду, удобному для сравнения. */
export function normalizeTeamName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

/** Находит логотип по явному id либо по совпадению названия команды. */
export function findTeamLogo<T extends { id: string; name: string }>(
  logos: T[],
  teamName: string,
  explicitId?: string | null,
): T | null {
  if (explicitId) {
    const found = logos.find((logo) => logo.id === explicitId);
    if (found) return found;
  }
  const key = normalizeTeamName(teamName);
  if (!key) return null;
  return logos.find((logo) => normalizeTeamName(logo.name) === key) ?? null;
}
