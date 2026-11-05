import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("public");
const port = Number(process.env.PORT || 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".txt": "text/plain",
};
http
  .createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://preview");
      if (u.pathname.startsWith("/api/")) {
        const r = await fetch(
          "https://1845bad0.cell-connecta.pages.dev" + u.pathname + u.search,
        );
        res.writeHead(r.status, {
          "Content-Type":
            r.headers.get("content-type") || "application/octet-stream",
        });
        res.end(Buffer.from(await r.arrayBuffer()));
        return;
      }
      let p = u.pathname;
      if (p === "/" || p === "/index.html") p = "/index.html";
      else if (/^\/(phone\/[^/]+|login|signup|forgot|admin)\/?$/.test(p))
        p = "/legacy.html";
      const target = path.resolve(root, "." + p);
      if (!target.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const body = await fs.readFile(target);
      res.writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log("Cell Connecta preview on port " + port),
  );
