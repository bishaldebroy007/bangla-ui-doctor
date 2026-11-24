import type { AuditReport, LanguageMode } from "@/types/audit";
import { getAuditReport } from "@/lib/mock-audit";
import { isSyntheticDemoUrl } from "./ssrf";
import { playwrightEngine } from "./playwright-engine";

export interface ScanEngineInput {
  url: string;
  languageMode: LanguageMode;
  enabledModules?: ("unicode" | "axe" | "fonts" | "viewports")[];
  fixtureKey?: "healthy" | "problematic" | "bilingual" | "custom";
}

export interface ScanEngine {
  run(input: ScanEngineInput): Promise<AuditReport>;
}

export const mockEngine: ScanEngine = {
  async run({ url, languageMode, fixtureKey }) {
    const presetKey =
      fixtureKey && fixtureKey !== "custom"
        ? fixtureKey
        : url.includes("seba-bangla-gov.demo")
        ? "healthy"
        : url.includes("dhaka-mart-bilingual.demo")
        ? "bilingual"
        : url.includes("legacy-bangla-portal.demo")
        ? "problematic"
        : null;
    return getAuditReport(presetKey, url, languageMode);
  },
};

/**
 * Default production engine:
 * - Uses deterministic fixture data only for the 3 synthetic `.demo` test hosts
 * - Executes the live Playwright + axe-core + Bengali DOM scanner for all real HTTP/HTTPS URLs
 */
export const defaultEngine: ScanEngine = {
  async run(input: ScanEngineInput) {
    if (isSyntheticDemoUrl(input.url)) {
      return mockEngine.run(input);
    }
    return playwrightEngine.run(input);
  },
};
