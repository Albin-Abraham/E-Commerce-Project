export {};

declare global {
  interface Window {
    __WS_CLIENT__?: any; // for debugging in dev: window.__WS_CLIENT__ = ws
  }
}
