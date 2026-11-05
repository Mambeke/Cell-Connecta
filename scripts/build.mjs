import { build } from "esbuild";
import fs from "node:fs/promises";
await fs.mkdir("build", { recursive: true });
await build({
  entryPoints: ["public/_worker.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "build/_worker.js",
  minify: false,
});
for (const name of ["store", "admin"])
  await build({
    entryPoints: ["public/cc-assets/" + name + ".js"],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile: "build/" + name + ".js",
  });
console.log(
  "Production Worker and browser modules bundled successfully. This does not deploy or migrate the database.",
);
