import { useEffect, useState } from "react";

import { LoadingService } from "@services/helpers/loading-service";

export function LoaderOverlay() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = LoadingService.instance().subscribe((e) => {
      if (e.state === "LOADING" || e.state === "SUBMITTING")
        setCount((c) => c + 1);
      else setCount((c) => Math.max(0, c - 1));
    });
    return () => {
      unsub();
    };
  }, []);

  if (!count) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-[var(--z-dropdown)]">
      <div className="loader-spinner animate-spin border-4 border-t-blue-500 rounded-full w-12 h-12"></div>
    </div>
  );
}
