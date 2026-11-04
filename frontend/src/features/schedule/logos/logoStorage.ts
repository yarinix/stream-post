import type { TeamLogo } from "./types";

const DB_NAME = "stream-post";
const STORE = "team-logos";
const DB_VERSION = 1;
const LS_KEY = "stream-post:team-logos:v1";

export const MAX_LOGOS = 40;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB недоступен"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть хранилище"));
  });
}

function getAll(db: IDBDatabase): Promise<TeamLogo[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as TeamLogo[]);
    request.onerror = () => reject(request.error ?? new Error("Не удалось прочитать логотипы"));
  });
}

function sanitize(items: unknown[]): TeamLogo[] {
  return items
    .filter((item): item is TeamLogo => {
      if (typeof item !== "object" || item === null) return false;
      const raw = item as Record<string, unknown>;
      return (
        typeof raw.id === "string" &&
        typeof raw.name === "string" &&
        typeof raw.dataUrl === "string" &&
        typeof raw.updatedAt === "number"
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// Fallback для приватного режима / старых браузеров: localStorage меньше по объёму, но доступен почти везде.
function loadLocal(): TeamLogo[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitize(parsed) : [];
  } catch {
    return [];
  }
}

function writeLocal(logos: TeamLogo[]): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(logos));
  } catch {
    // места может не хватить — IndexedDB в этом случае остаётся основным хранилищем
  }
}

async function readAll(): Promise<TeamLogo[]> {
  try {
    const db = await openDb();
    try {
      return sanitize(await getAll(db));
    } finally {
      db.close();
    }
  } catch {
    return loadLocal();
  }
}

async function writeAll(logos: TeamLogo[]): Promise<TeamLogo[]> {
  writeLocal(logos);
  try {
    const db = await openDb();
    try {
      // Полностью перезаписываем набор: так состояние одинаково в обоих хранилищах.
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      logos.forEach((logo) => store.put(logo));
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Не удалось записать логотипы"));
      });
    } finally {
      db.close();
    }
  } catch {
    // IndexedDB недоступен — работаем на localStorage
  }
  return logos;
}

export async function loadLogos(): Promise<TeamLogo[]> {
  return readAll();
}

export async function addLogo(logo: TeamLogo): Promise<TeamLogo[]> {
  const current = await readAll();
  if (current.length >= MAX_LOGOS) {
    throw new Error(`Максимум ${MAX_LOGOS} логотипов. Удалите лишние.`);
  }
  return writeAll([logo, ...current.filter((item) => item.id !== logo.id)]);
}

export async function removeLogo(id: string): Promise<TeamLogo[]> {
  const current = await readAll();
  return writeAll(current.filter((item) => item.id !== id));
}

export async function updateLogo(
  id: string,
  patch: Partial<Pick<TeamLogo, "name" | "dataUrl">>,
): Promise<TeamLogo[]> {
  const current = await readAll();
  return writeAll(
    current.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item)),
  );
}
