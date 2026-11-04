import { useCallback, useEffect, useState } from "react";

import { fileToLogoDataUrl, newLogoId } from "../logos/image";
import { addLogo, loadLogos, removeLogo, updateLogo } from "../logos/logoStorage";
import type { TeamLogo } from "../logos/types";

export interface TeamLogosApi {
  logos: TeamLogo[];
  ready: boolean;
  error: string | null;
  setError: (message: string | null) => void;
  add: (name: string, file: File) => Promise<TeamLogo>;
  remove: (id: string) => Promise<unknown>;
  rename: (id: string, name: string) => Promise<unknown>;
  replace: (id: string, file: File) => Promise<unknown>;
}

/** Библиотека логотипов команд: живёт на устройстве, без backend и без сети. */
export function useTeamLogos(): TeamLogosApi {
  const [logos, setLogos] = useState<TeamLogo[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadLogos()
      .then((items) => {
        if (alive) setLogos(items);
      })
      .catch(() => {
        if (alive) setError("Не удалось загрузить сохранённые логотипы");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const add = useCallback(async (name: string, file: File): Promise<TeamLogo> => {
    const dataUrl = await fileToLogoDataUrl(file);
    const logo: TeamLogo = {
      id: newLogoId(),
      name: name.trim() || "Без названия",
      dataUrl,
      updatedAt: Date.now(),
    };
    setLogos(await addLogo(logo));
    return logo;
  }, []);

  const remove = useCallback(async (id: string) => {
    setLogos(await removeLogo(id));
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    setLogos(await updateLogo(id, { name }));
  }, []);

  const replace = useCallback(async (id: string, file: File) => {
    const dataUrl = await fileToLogoDataUrl(file);
    setLogos(await updateLogo(id, { dataUrl }));
  }, []);

  return { logos, ready, error, setError, add, remove, rename, replace };
}
