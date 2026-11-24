export type FindingSeverity = "critical" | "warning" | "suggestion";

export type FindingConfidence = "high" | "medium" | "low";

export type LanguageMode = "bn" | "en" | "bilingual";

export type AuditCategory =
  | "Bengali Unicode"
  | "Accessibility"
  | "Typography & Fonts"
  | "Responsive Layout"
  | "Localization";

export type ViewportProfile = "mobile" | "tablet" | "desktop";

export interface AuditFinding {
  id: string;
  ruleId: string;
  category: AuditCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  message: string;
  explanation: string;
  recommendation: string;
  selector?: string;
  evidence?: string;
  codeFix?: string;
  viewport?: ViewportProfile;
  requiresHumanReview?: boolean;
}

export interface CategoryScore {
  category: AuditCategory;
  score: number;
  passed: number;
  issues: number;
}

export interface ViewportSnapshot {
  profile: ViewportProfile;
  label: string;
  widthPx: number;
  overflowDetected: boolean;
  clippedElements: number;
  status: "pass" | "warn" | "fail";
  highlights: {
    id: string;
    label: string;
    severity: FindingSeverity;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    findingId: string;
  }[];
}

export interface AuditReport {
  id: string;
  fixtureKey: "healthy" | "problematic" | "bilingual" | "custom";
  url: string;
  siteTitle: string;
  languageMode: LanguageMode;
  detectedHtmlLang: string | null;
  overallScore: number;
  scanDurationMs: number;
  scannedAt: string;
  fontStackDetected: string[];
  bengaliFontLoaded: boolean;
  unicodeHealth: {
    replacementChars: number;
    nfdSequences: number;
    numeralStyle: "bengali" | "latin" | "mixed";
  };
  categoryScores: CategoryScore[];
  viewports: ViewportSnapshot[];
  findings: AuditFinding[];
}

export interface FixturePreset {
  key: "healthy" | "problematic" | "bilingual";
  name: string;
  badge: string;
  url: string;
  languageMode: LanguageMode;
  description: string;
}
