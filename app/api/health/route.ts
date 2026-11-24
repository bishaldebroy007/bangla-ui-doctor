import { connection, NextResponse } from "next/server";
import { getPool } from "@/lib/db/pool";
import { getJson, putJson } from "@/lib/storage/client";


export async function GET() {
  await connection();
  const checks: Record<string, string> = {};
  try {
    const { rows } = await getPool().query("SELECT 1 AS ok");
    checks.postgres = rows[0].ok === 1 ? "ok" : "bad";
  } catch (e) {
    checks.postgres = `error: ${(e as Error).message}`;
  }
  try {
    const key = "health/ping.json";
    const stamp = String(Date.now());
    await putJson(key, { stamp });
    checks.storage = (await getJson<{ stamp: string }>(key)).stamp === stamp ? "ok" : "bad";
  } catch (e) {
    checks.storage = `error: ${(e as Error).message}`;
  }
  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
