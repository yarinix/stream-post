import { useCallback, useEffect, useState } from "react";

import {
  loadPostTextSettings,
  savePostTextSettings,
  type PostTextSettings,
} from "../postText/settings";

export interface PostTextSettingsApi {
  settings: PostTextSettings;
  patch: (changes: Partial<PostTextSettings>) => void;
}

export function usePostTextSettings(): PostTextSettingsApi {
  const [settings, setSettings] = useState<PostTextSettings>(loadPostTextSettings);

  useEffect(() => {
    savePostTextSettings(settings);
  }, [settings]);

  const patch = useCallback((changes: Partial<PostTextSettings>) => {
    setSettings((current) => ({ ...current, ...changes }));
  }, []);

  return { settings, patch };
}
