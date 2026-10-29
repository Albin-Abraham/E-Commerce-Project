import type { WSConfig } from "./ws.model";

export const defaultWSConfig: WSConfig = {
  url: "",
  autoReconnect: true,
  reconnectDelay: 2000,
  maxReconnectDelay: 20000,
  heartbeatInterval: 15000,
  timeout: 5000,
  debug: false,
};
