import "server-only";
import { getJson, presignGet, putJson } from "@/lib/storage/client";
import type { AuditReport } from "@/types/audit";
import { defaultEngine, type ScanEngine } from "./engine";
import * as repo from "./repository";
import type { CreateScanInput } from "./schema";
import { assertSafePublicUrl } from "./ssrf";

/** Creates the scan row, runs the engine, stores the full report in object storage. */
export async function createScan(input: CreateScanInput, engine: ScanEngine = defaultEngine) {
  // Perform SSRF & DNS check up front before creating or executing the scan
  await assertSafePublicUrl(input.url);

  const scan = await repo.insertScan(input.url, input.languageMode);
  try {
    await repo.markRunning(scan.id);
    const report = await engine.run(input);
    const stored: AuditReport = { ...report, id: scan.id };
    const key = `reports/${scan.id}.json`;
    await putJson(key, stored);
    const completedScan = await repo.markCompleted(
      scan.id,
      stored.overallScore,
      stored.findings.length,
      key
    );
    return { scan: completedScan, report: stored };
  } catch (e) {
    await repo.markFailed(scan.id, e instanceof Error ? e.message : String(e));
    throw e;
  }
}

export const listScans = repo.listScans;

export async function getScanWithReport(id: string) {
  const scan = await repo.findScan(id);
  if (!scan) return null;
  const report = scan.reportKey ? await getJson<AuditReport>(scan.reportKey) : null;
  const reportUrl = scan.reportKey ? await presignGet(scan.reportKey) : null;
  return { scan, report, reportUrl };
}
