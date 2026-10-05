import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Local-only: /api is proxied to the Lightning sidecar (server/lightning-sidecar.mjs).
// The NWC secret lives only in that Node process's env — never VITE_*, never bundled.
// GitHub Pages has no /api, so Real mode there stays address-only.
const sidecarProxy = {
  "/api": {
    target: `http://127.0.0.1:${process.env.SIDECAR_PORT || 4174}`,
    changeOrigin: false,
  },
};

// Base path: "/" for local preview and a custom domain; "/music-pitch/" for
// project Pages. CI passes `--base` from actions/configure-pages, which overrides
// this. Public assets go through `asset()` in src/lib/utils.ts so either works.
const base = process.env.BASE_PATH || "/";

// Absolute site URL for Open Graph / Twitter cards (crawlers need absolute URLs).
// CI sets SITE_URL from configure-pages; the fallback is the project Pages URL.
const siteUrl = (process.env.SITE_URL || "https://welliv.github.io/music-pitch/").replace(/\/?$/, "/");

function socialMeta(): Plugin {
  return {
    name: "social-meta-site-url",
    transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", siteUrl),
  };
}

export default defineConfig({
  base,
  plugins: [react(), socialMeta()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    proxy: sidecarProxy,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: sidecarProxy,
  },
});
