import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// Offline artifact preparation only. Never deploys, authenticates or touches D1.
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const arg = process.argv[2];
if (!arg)
  throw new Error(
    "Usage: node scripts/prepare-release.mjs /absolute/path/to/NEW/upload-directory",
  );
const target = path.resolve(arg);
for (const protectedPath of [
  root,
  ...["public", "server", "scripts", "tests", "build"].map((d) =>
    path.join(root, d),
  ),
]) {
  if (
    target === protectedPath ||
    (protectedPath !== root && target.startsWith(protectedPath + path.sep))
  ) {
    throw new Error(
      "Refusing an output directory inside protected source/build paths.",
    );
  }
}
try {
  await fs.access(target);
  throw new Error(
    "Output directory already exists. Choose a fresh path; nothing was overwritten.",
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
async function walk(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isSymbolicLink())
      throw new Error("Refusing symlink in release input: " + name);
    if (entry.isDirectory()) files.push(...(await walk(name)));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}
const serverSources = (await walk(path.join(root, "server"))).filter((f) =>
  f.endsWith(".js"),
);
const workerSources = [path.join(root, "public/_worker.js"), ...serverSources];
for (const [bundle, inputs] of [
  ["_worker.js", workerSources],
  ["store.js", [path.join(root, "public/cc-assets/store.js")]],
  ["admin.js", [path.join(root, "public/cc-assets/admin.js")]],
]) {
  const built = await fs.stat(path.join(root, "build", bundle));
  for (const input of inputs) {
    if ((await fs.stat(input)).mtimeMs > built.mtimeMs) {
      throw new Error(
        "Build is stale. Run npm run build before preparing a release.",
      );
    }
  }
}
await walk(path.join(root, "public"));
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.mkdir(target);
const publicDir = path.join(target, "public");
await fs.cp(path.join(root, "public"), publicDir, { recursive: true });
await fs.copyFile(
  path.join(root, "build/_worker.js"),
  path.join(publicDir, "_worker.js"),
);
for (const name of ["store", "admin"]) {
  await fs.copyFile(
    path.join(root, "build", name + ".js"),
    path.join(publicDir, "cc-assets", name + ".js"),
  );
}
const files = (await walk(publicDir)).sort();
const manifest = {};
for (const file of files) {
  manifest[path.relative(publicDir, file)] = createHash("sha256")
    .update(await fs.readFile(file))
    .digest("hex");
}
await fs.writeFile(
  path.join(target, "artifact-sha256.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Prepared standalone release:", publicDir);
console.log(
  "Files:",
  files.length,
  "— checksum manifest outside public directory.",
);
console.log(
  "No deployment, configuration change or database operation was performed.",
);
