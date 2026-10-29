import type { WSMessage } from "./ws.model";

export type SendMiddleware = (
  msg: WSMessage
) => WSMessage | null | Promise<WSMessage | null>;
export type ReceiveMiddleware = (
  msg: WSMessage
) => WSMessage | null | Promise<WSMessage | null>;

export class MiddlewareManager {
  send: SendMiddleware[] = [];
  receive: ReceiveMiddleware[] = [];

  useSend(m: SendMiddleware) {
    this.send.push(m);
  }
  useReceive(m: ReceiveMiddleware) {
    this.receive.push(m);
  }

  async runSend(msg: WSMessage) {
    let m: WSMessage | null = msg;
    for (const fn of this.send) {
      if (!m) break;
      m = await fn(m);
    }
    return m;
  }

  async runReceive(msg: WSMessage) {
    let m: WSMessage | null = msg;
    for (const fn of this.receive) {
      if (!m) break;
      m = await fn(m);
    }
    return m;
  }
}
