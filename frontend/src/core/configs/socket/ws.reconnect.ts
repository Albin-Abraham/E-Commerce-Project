export class WSReconnect {
  attempts = 0;
  constructor(private client: any) {}

  schedule() {
    if (!this.client.config.autoReconnect) return;

    this.attempts++;
    const base = this.client.config.reconnectDelay ?? 2000;
    const max = this.client.config.maxReconnectDelay ?? 20000;
    const delay = Math.min(base * this.attempts + Math.random() * 500, max);

    setTimeout(() => this.client.connect(), delay);
  }

  reset() {
    this.attempts = 0;
  }
}
