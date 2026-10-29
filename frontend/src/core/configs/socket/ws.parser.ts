import type { WSMessage } from "./ws.model";

export async function parseMessage(data: any): Promise<WSMessage | null> {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return parsed.event ? parsed : { event: "UNKNOWN", payload: parsed };
  } catch {
    return { event: "UNKNOWN", payload: data };
  }
}
