export interface WSConfig {
  url: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
  protocols?: string | string[];
  authToken?: string | null;
  debug?: boolean;
}

export interface WSMessage<T = any> {
  event: string;
  payload: T;
  meta?: Record<string, any>;
}
