import fs from "node:fs/promises";
import path from "node:path";

export async function loadLocalEnv(currentMode, rootDir) {
  const files = [".env", ".env.local", `.env.${currentMode}`, `.env.${currentMode}.local`];
  const values = {};

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(rootDir, file), "utf8");
      Object.assign(values, parseEnvFile(content));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return values;
}

function parseEnvFile(content) {
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const entry = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = entry.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = entry.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}
