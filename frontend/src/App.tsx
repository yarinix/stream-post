import { useEffect } from "react";

import HomePage from "./pages/HomePage";
import SchedulePage from "./pages/SchedulePage";
import { useHashRoute } from "./router/useHashRoute";

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (route === "/schedule") return <SchedulePage />;
  return <HomePage />;
}
