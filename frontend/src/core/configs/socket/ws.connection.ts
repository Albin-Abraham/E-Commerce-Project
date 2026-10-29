import { WSClient } from "./ws.client";
import type { WSMessage } from "./ws.model";
import { parseMessage } from "./ws.parser";

export class WSConnection {
  ws: WebSocket | null = null;

  constructor(private client: WSClient) {}

  open() {
    const url = this.buildUrl();
    this.ws = new WebSocket(url);

    // timeout
    const timeoutTimer = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.client.close();
      }
    }, this.client.config.timeout);

    this.ws.onopen = () => {
      clearTimeout(timeoutTimer);
      this.client.heartbeat.start();
      this.client.reconnect.reset();
      if (this.client.config.debug) console.log("[WS] connected");
    };

    this.ws.onmessage = async (ev) => {
      const msg = await parseMessage(ev.data);
      if (!msg) return;

      if (msg.event === "PING") {
        this.send({ event: "PONG", payload: { ts: Date.now() } });
        return;
      }

      this.client.events.emit(msg.event, msg.payload);
    };

    this.ws.onclose = () => {
      this.client.heartbeat.stop();
      this.client.reconnect.schedule();
    };

    this.ws.onerror = (e) => {
      if (this.client.config.debug) console.error("[WS] error", e);
      try {
        this.ws?.close();
      } catch {
        // Best-effort close: the socket may already be torn down.
      }
    };
  }

  private buildUrl() {
    const { url, authToken } = this.client.config;
    return authToken ? `${url}?token=${authToken}` : url;
  }

  async send(msg: WSMessage) {
    const processed = await this.client.middleware.runSend(msg);
    if (!processed) return;
    if (this.ws?.readyState === WebSocket.OPEN)
      this.ws.send(JSON.stringify(processed));
  }

  close() {
    this.ws?.close();
  }
}
