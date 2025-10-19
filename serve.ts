#!/usr/bin/env -S deno run -A
/// <reference lib="deno.ns" />

import { serveDir } from "std/http/file_server.ts";

const PORT = 8080;

console.log(`🚀 CDN Server running at http://localhost:${PORT}`);
console.log(`📁 Serving files from ./dist/ and HTML files from ./`);
console.log("\nAvailable endpoints:");
console.log(`- http://localhost:${PORT}/lucid-js.js (ESM development)`);
console.log(`- http://localhost:${PORT}/lucid-js.min.js (ESM production)`);
console.log(`- http://localhost:${PORT}/contador.html (Teste do contador)`);

Deno.serve({ port: PORT }, (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Serve HTML files from root directory
  if (pathname.endsWith(".html")) {
    return serveDir(req, {
      fsRoot: "./",
      headers: [
        "access-control-allow-origin: *",
        "content-type: text/html; charset=utf-8",
      ],
    });
  }

  // Serve JS files from dist directory
  return serveDir(req, {
    fsRoot: "./dist",
    headers: [
      "access-control-allow-origin: *",
      "access-control-allow-methods: GET, HEAD, OPTIONS",
      "access-control-allow-headers: *",
      "cache-control: public, max-age=31536000", // 1 year cache for CDN
    ],
  });
});
