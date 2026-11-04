import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";

function freellmProxy(key: string): ProxyOptions {
  return {
    target: process.env.FREELLMAPI_URL || "http://127.0.0.1:3001",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/freellm/, ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        // Inject key on the server side only — never ship it in the browser bundle.
        if (key) {
          proxyReq.setHeader("Authorization", `Bearer ${key}`);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // load all env (not only VITE_) so FREELLMAPI_KEY stays server-side
  const env = loadEnv(mode, process.cwd(), "");
  const key = (env.FREELLMAPI_KEY || "").trim();

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/freellm": freellmProxy(key),
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        "/freellm": freellmProxy(key),
      },
    },
  };
});
