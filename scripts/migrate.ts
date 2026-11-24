// Usage: bun run db:migrate  (uses the direct/unpooled connection, per Neon guidance)
import { Client } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED/DATABASE_URL not set");

const dir = join(process.cwd(), "db/migrations");
const client = new Client({ connectionString: url });
await client.connect();
await client.query(
  "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
);
const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(file)) continue;
  await client.query("BEGIN");
  try {
    await client.query(readFileSync(join(dir, file), "utf8"));
    await client.query("INSERT INTO _migrations(name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("applied", file);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}
await client.end();
console.log("migrations up to date");
