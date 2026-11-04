import { useEffect } from "react";

import { isPostMode } from "./features/schedule/constants";
import type { PostMode } from "./features/schedule/types";
import HomePage from "./pages/HomePage";
import SchedulePage, { type ScheduleTab } from "./pages/SchedulePage";
import { useHashRoute } from "./router/useHashRoute";

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const [path, query] = route.split("?");

  if (path === "/schedule") {
    const params = new URLSearchParams(query ?? "");
    const requested = params.get("tab");
    const initialTab: ScheduleTab =
      requested === "logos" || requested === "preview" || requested === "text"
        ? requested
        : "edit";
    const modeParam = params.get("mode");
    const requestedMode: PostMode = isPostMode(modeParam) ? modeParam : "schedule";
    return <SchedulePage initialTab={initialTab} requestedMode={requestedMode} />;
  }

  return <HomePage />;
}
