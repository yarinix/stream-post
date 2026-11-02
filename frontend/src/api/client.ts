// Базовый адрес API. Пусто — запросы идут на /api того же домена.
const rawBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const API_BASE = rawBase.replace(/\/+$/, "");

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`);
  }

  return (await response.json()) as T;
}
