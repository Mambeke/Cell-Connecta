import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const files = [
  "public/_worker.js",
  ...(await readdir("server"))
    .filter((n) => n.endsWith(".js"))
    .map((n) => "server/" + n),
  ...["store", "admin"].map((n) => "public/cc-assets/" + n + ".js"),
  ...(await readdir("scripts"))
    .filter((n) => n.endsWith(".mjs"))
    .map((n) => "scripts/" + n),
];
for (const file of files) {
  const r = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (r.status) process.exit(r.status);
}
console.log("Syntax checks passed for " + files.length + " source modules.");
