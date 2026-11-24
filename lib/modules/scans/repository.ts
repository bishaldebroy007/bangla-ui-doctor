import "server-only";
import { getPool } from "@/lib/db/pool";

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export interface ScanRecord {
  id: string;
  url: string;
  languageMode: "bn" | "en" | "bilingual";
  status: ScanStatus;
  overallScore: number | null;
  findingCount: number | null;
  reportKey: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

const COLS = `id, url, language_mode AS "languageMode", status, overall_score AS "overallScore",
  finding_count AS "findingCount", report_key AS "reportKey", error,
  created_at AS "createdAt", completed_at AS "completedAt"`;

export async function insertScan(url: string, languageMode: string): Promise<ScanRecord> {
  const { rows } = await getPool().query(
    `INSERT INTO scans (url, language_mode) VALUES ($1, $2) RETURNING ${COLS}`,
    [url, languageMode],
  );
  return rows[0];
}

export async function markRunning(id: string) {
  await getPool().query(`UPDATE scans SET status='running' WHERE id=$1`, [id]);
}

export async function markCompleted(id: string, score: number, findings: number, reportKey: string) {
  const { rows } = await getPool().query(
    `UPDATE scans SET status='completed', overall_score=$2, finding_count=$3, report_key=$4, completed_at=now()
     WHERE id=$1 RETURNING ${COLS}`,
    [id, score, findings, reportKey],
  );
  return rows[0] as ScanRecord;
}

export async function markFailed(id: string, error: string) {
  await getPool().query(
    `UPDATE scans SET status='failed', error=$2, completed_at=now() WHERE id=$1`,
    [id, error],
  );
}

export async function findScan(id: string): Promise<ScanRecord | null> {
  const { rows } = await getPool().query(`SELECT ${COLS} FROM scans WHERE id=$1`, [id]);
  return rows[0] ?? null;
}

export async function listScans(limit = 20): Promise<ScanRecord[]> {
  const { rows } = await getPool().query(
    `SELECT ${COLS} FROM scans ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}
