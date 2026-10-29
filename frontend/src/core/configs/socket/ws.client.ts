import { defaultWSConfig } from "./ws.config";
import { WSConnection } from "./ws.connection";
import { WSEventBus } from "./ws.events";
import { WSHeartbeat } from "./ws.heartbeat";
import { MiddlewareManager } from "./ws.middleware";
import type { WSConfig } from "./ws.model";
import { WSReconnect } from "./ws.reconnect";

export class WSClient {
  config: WSConfig;

  connection: WSConnection;
  reconnect: WSReconnect;
  heartbeat: WSHeartbeat;
  events = new WSEventBus();
  middleware = new MiddlewareManager();

  constructor(config: WSConfig) {
    this.config = { ...defaultWSConfig, ...config };

    this.connection = new WSConnection(this);
    this.reconnect = new WSReconnect(this);
    this.heartbeat = new WSHeartbeat(this);

    if (this.config.debug) (window as any).__WS_CLIENT__ = this;
  }

  connect() {
    this.connection.open();
  }

  send(event: string, payload: any) {
    this.connection.send({ event, payload });
  }

  on(event: string, fn: (data: any) => void) {
    this.events.on(event, fn);
  }

  off(event: string, fn?: (data: any) => void) {
    this.events.off(event, fn);
  }

  close() {
    this.connection.close();
  }
}
