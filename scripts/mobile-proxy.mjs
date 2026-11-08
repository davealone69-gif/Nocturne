import http from "node:http";
import net from "node:net";

try { process.loadEnvFile(); } catch { /* .env is optional; health remains useful without it. */ }

const HOST = "127.0.0.1";
const PORT = Number(process.env.NOCTURNE_PROXY_PORT || 4173);
const UPSTREAM_HOST = "127.0.0.1";
const UPSTREAM_PORT = Number(process.env.FREELLMAPI_PORT || 3001);
const API_KEY = (process.env.FREELLMAPI_KEY || "").trim();
const ALLOWED_ORIGINS = new Set(["http://localhost", "http://localhost:8100"]);

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: UPSTREAM_HOST, port, timeout: 900 });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.url === "/health" && req.method === "GET") {
    const api = await portOpen(UPSTREAM_PORT);
    const body = JSON.stringify({ proxy: true, freellmapi: api, apiKeyConfigured: Boolean(API_KEY) });
    res.writeHead(api && API_KEY ? 200 : 503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(body);
  }

  if (!req.url?.startsWith("/freellm/v1/") || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: { message: "Not found" } }));
  }
  if (!API_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: { message: "FREELLMAPI_KEY is missing from the Nocturne .env file." } }));
  }

  const upstreamPath = req.url.replace(/^\/freellm/, "");
  const upstream = http.request({
    host: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: upstreamPath,
    method: req.method,
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json",
      "Content-Length": req.headers["content-length"] || undefined,
      Authorization: `Bearer ${API_KEY}`,
    },
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, {
      "Content-Type": upstreamRes.headers["content-type"] || "application/json",
      "Cache-Control": "no-store",
    });
    upstreamRes.pipe(res);
  });
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "FreeLLMAPI is not reachable on 127.0.0.1:3001." } }));
  });
  req.pipe(upstream);
});

server.listen(PORT, HOST, () => {
  console.log(`Nocturne local proxy listening on http://${HOST}:${PORT}`);
});
