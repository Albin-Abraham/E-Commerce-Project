export class WSHeartbeat {
  timer: any = null;
  constructor(private client: any) {}

  start() {
    this.stop();
    this.timer = setInterval(() => {
      this.client.send("PING", { ts: Date.now() });
    }, this.client.config.heartbeatInterval);
  }

  stop() {
    clearInterval(this.timer);
  }
}
