import "server-only";
import { Pool } from "pg";
import { getEnv } from "@/lib/server/env";

// Long-running Node server => node-postgres with the pooled (-pooler) URL.
// Cached on globalThis so dev HMR doesn't leak pools.
const g = globalThis as unknown as { __pgPool?: Pool };

export function getPool(): Pool {
  return (g.__pgPool ??= new Pool({ connectionString: getEnv().DATABASE_URL, max: 10 }));
}
