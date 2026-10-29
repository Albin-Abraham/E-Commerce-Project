export function initViteHmrTerminal() {
  if (!import.meta.hot) return;

  const log = (...args: any[]) =>
    console.log("%c[VITE-HMR]", "color: #0b76ef; font-weight:bold;", ...args);

  import.meta.hot.on("vite:beforeUpdate", (payload) =>
    log("Before update:", payload)
  );
  import.meta.hot.on("vite:afterUpdate", (payload) =>
    log("After update:", payload)
  );
  import.meta.hot.on("vite:error", (err) =>
    console.error("[VITE-HMR] Error:", err)
  );
  import.meta.hot.on("vite:hmr:connection-error", (err) =>
    console.warn("[VITE-HMR] Connection lost:", err)
  );
  import.meta.hot.on("vite:hmr:connected", () =>
    log("Connected to Vite server ✅")
  );
}
