import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadPostTextDraft,
  savePostTextDraft,
  type PostTextDraft,
  type PostTextSettings,
} from "../postText/settings";
import { buildPostText, type PostTextInfo } from "../postText/template";
import type { ScheduleData } from "../types";

export interface PostTextState {
  /** Текст, который видит пользователь (сгенерированный или его ручная правка). */
  text: string;
  generated: string;
  info: PostTextInfo;
  /** true — пользователь правил текст вручную. */
  edited: boolean;
  /** true — данные изменились после ручной правки, текст показывает старую версию. */
  outdated: boolean;
  setText: (value: string) => void;
  regenerate: () => void;
}

export function usePostText(data: ScheduleData, settings: PostTextSettings): PostTextState {
  const { text: generated, signature, info } = useMemo(
    () => buildPostText(data, settings),
    [data, settings],
  );

  // Ручная правка переживает перезагрузку, только если исходные данные не изменились.
  const [manual, setManual] = useState<PostTextDraft | null>(() => {
    const draft = loadPostTextDraft();
    return draft && draft.signature === signature ? draft : null;
  });

  useEffect(() => {
    savePostTextDraft(manual);
  }, [manual]);

  const outdated = Boolean(manual && manual.signature !== signature);

  const setText = useCallback(
    (value: string) => setManual({ signature, text: value }),
    [signature],
  );
  const regenerate = useCallback(() => setManual(null), []);

  return {
    // Пока есть ручная правка — показываем её, даже если данные изменились:
    // пользователь видит явное предупреждение и сам решает, когда собрать текст заново.
    text: manual ? manual.text : generated,
    generated,
    info,
    edited: manual !== null,
    outdated,
    setText,
    regenerate,
  };
}
