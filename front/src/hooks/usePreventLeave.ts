import { useEffect } from "react";

export function usePreventLeave(active = true) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
