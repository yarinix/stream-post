import { useEffect, useState } from "react";

function readRoute(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

/** Простейший роутер на основе #hash: работает на статическом хостинге без настройки сервера. */
export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
