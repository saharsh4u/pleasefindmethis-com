import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

test("request email updates default off, survive draft persistence, and publish with the request", () => {
  assert.match(mainSource, /type PostDraft = \{[\s\S]*?emailClueNotifications: boolean;/);
  assert.match(mainSource, /const initialPostDraft: PostDraft = \{[\s\S]*?emailClueNotifications: false,/);
  assert.match(mainSource, /postDraftToStoredDraft[\s\S]*?emailClueNotifications: draft\.emailClueNotifications/);
  assert.match(mainSource, /emailClueNotifications: parsed\.emailClueNotifications === true/);
  assert.match(mainSource, /Get email updates when someone leaves a clue/);
  assert.match(mainSource, /We’ll email you whenever someone comments on your request\./);
  assert.match(mainSource, /type="checkbox"[\s\S]*?checked=\{draft\.emailClueNotifications\}/);
  assert.match(mainSource, /email_clue_notifications: draft\.emailClueNotifications/);
});

test("the requests schema persists an opt-in notification preference with a false default", async () => {
  const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
  const migrationFiles = (await readdir(migrationsUrl)).sort();
  const migrationSources = await Promise.all(
    migrationFiles.map((fileName) => readFile(new URL(fileName, migrationsUrl), "utf8")),
  );
  const schemaSource = migrationSources.join("\n");

  assert.match(
    schemaSource,
    /add column if not exists email_clue_notifications boolean not null default false/i,
  );
  assert.match(
    schemaSource,
    /grant insert \([\s\S]*?email_clue_notifications[\s\S]*?\) on public\.requests to authenticated/i,
  );
});
