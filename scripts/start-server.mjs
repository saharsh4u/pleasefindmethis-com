import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalEnv } from "./load-local-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.env.NODE_ENV === "production" ? "production" : "development";

if (process.env.VERCEL !== "1") {
  const env = await loadLocalEnv(mode, root);

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

await import("../server.mjs");
