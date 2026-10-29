export interface DebugConfig {
  isEnabled: boolean;
  hotkey: string;
  defaultNetworkLatencyMs: number;
}

export const debugConfig: DebugConfig = {
  isEnabled: !import.meta.env.PROD,
  hotkey: "ctrl+shift+d",
  defaultNetworkLatencyMs: 0,
};
