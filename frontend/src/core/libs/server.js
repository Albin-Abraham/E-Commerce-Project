// server.js (ES module)
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "PING") {
        console.log("Received PING from client:", data.payload);

        // Send PONG back
        ws.send(
          JSON.stringify({
            event: "PONG",
            payload: { ts: Date.now() },
          })
        );

        console.log("Sent PONG to client");
      } else {
        console.log("Received message from client:", data);
        ws.send(
          JSON.stringify({
            event: "ECHO",
            payload: data,
          })
        );
      }
    } catch (err) {
      console.error("Failed to parse message:", msg.toString(), err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server running on ws://localhost:8080");
