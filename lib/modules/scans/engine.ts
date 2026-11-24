import type { AuditReport, LanguageMode } from "@/types/audit";
import { getAuditReport } from "@/lib/mock-audit";

/** Swap this for the Playwright/axe worker later; the rest of the backend is engine-agnostic. */
export interface ScanEngine {
  run(input: { url: string; languageMode: LanguageMode }): Promise<AuditReport>;
}

export const mockEngine: ScanEngine = {
  async run({ url, languageMode }) {
    return getAuditReport(null, url, languageMode);
  },
};
