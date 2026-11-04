import { useEffect } from "react";

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
    const requested = new URLSearchParams(query ?? "").get("tab");
    const initialTab: ScheduleTab =
      requested === "logos" || requested === "preview" || requested === "text"
        ? requested
        : "edit";
    return <SchedulePage initialTab={initialTab} />;
  }

  return <HomePage />;
}
