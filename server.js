const express = require("express");
const http = require("http");
const path = require("path");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;
const EVENT_SECRET = process.env.EVENT_SECRET || "";

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

function broadcast(data) {
  const packet = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(packet);
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "Quiz Live PRO" }));

// Contrato genérico de eventos: um conector autorizado pode enviar comment ou gift.
// Não coleta senha, cookie, token de sessão ou dados privados da conta.
app.post("/event", (req, res) => {
  if (EVENT_SECRET && req.get("x-event-secret") !== EVENT_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const body = req.body || {};
  const type = String(body.type || "");
  const username = String(body.username || "Visitante").slice(0, 32);
  const eventId = String(body.eventId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  if (type === "comment") {
    const comment = String(body.comment || "").trim().slice(0, 120);
    if (!comment) return res.status(400).json({ ok: false, error: "empty_comment" });
    broadcast({ type, username, comment, eventId, receivedAt: Date.now() });
    return res.json({ ok: true });
  }

  if (type === "gift") {
    const giftName = String(body.giftName || "Presente").slice(0, 40);
    const giftCount = Math.max(1, Math.min(99, Number(body.giftCount) || 1));
    broadcast({ type, username, giftName, giftCount, eventId, receivedAt: Date.now() });
    return res.json({ ok: true });
  }

  return res.status(400).json({ ok: false, error: "unsupported_event_type" });
});

wss.on("connection", socket => {
  socket.send(JSON.stringify({ type: "connection", connected: true }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Quiz Live PRO rodando em http://localhost:${PORT}`);
});