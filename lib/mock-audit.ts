import type { AuditReport, FixturePreset, LanguageMode } from "@/types/audit";

export const FIXTURE_PRESETS: FixturePreset[] = [
  {
    key: "problematic",
    name: "Fixture B: Legacy Bangla Portal",
    badge: "11 Issues",
    url: "https://legacy-bangla-portal.demo",
    languageMode: "bn",
    description:
      "Missing lang=\"bn\", U+FFFD replacement glyphs, clipped 360px CTA buttons, and unlabelled inputs.",
  },
  {
    key: "bilingual",
    name: "Fixture C: Bilingual Commerce",
    badge: "5 Issues",
    url: "https://dhaka-mart-bilingual.demo",
    languageMode: "bilingual",
    description:
      "Bangla + English passages, mixed numerals, and untranslated checkout placeholders.",
  },
  {
    key: "healthy",
    name: "Fixture A: Healthy Bangla Gov",
    badge: "96 Score",
    url: "https://seba-bangla-gov.demo",
    languageMode: "bn",
    description:
      "Clean NFC Unicode, Noto Sans Bengali loaded, WCAG AA contrast, zero overflow.",
  },
];

const HEALTHY_REPORT: AuditReport = {
  id: "scan-fixture-a",
  fixtureKey: "healthy",
  url: "https://seba-bangla-gov.demo",
  siteTitle: "জাতীয় নাগরিক সেবা পোর্টাল (Seba Portal)",
  languageMode: "bn",
  detectedHtmlLang: "bn",
  overallScore: 96,
  scanDurationMs: 2840,
  scannedAt: "2026-11-25T01:45:00Z",
  fontStackDetected: ["Noto Sans Bengali", "Hind Siliguri", "system-ui", "sans-serif"],
  bengaliFontLoaded: true,
  unicodeHealth: {
    replacementChars: 0,
    nfdSequences: 0,
    numeralStyle: "bengali",
  },
  categoryScores: [
    { category: "Bengali Unicode", score: 100, passed: 8, issues: 0 },
    { category: "Accessibility", score: 94, passed: 14, issues: 1 },
    { category: "Typography & Fonts", score: 98, passed: 6, issues: 0 },
    { category: "Responsive Layout", score: 96, passed: 9, issues: 0 },
    { category: "Localization", score: 92, passed: 7, issues: 1 },
  ],
  viewports: [
    {
      profile: "mobile",
      label: "Mobile",
      widthPx: 360,
      overflowDetected: false,
      clippedElements: 0,
      status: "pass",
      highlights: [],
    },
    {
      profile: "tablet",
      label: "Tablet",
      widthPx: 768,
      overflowDetected: false,
      clippedElements: 0,
      status: "pass",
      highlights: [],
    },
    {
      profile: "desktop",
      label: "Desktop",
      widthPx: 1440,
      overflowDetected: false,
      clippedElements: 0,
      status: "pass",
      highlights: [],
    },
  ],
  findings: [
    {
      id: "h-1",
      ruleId: "a11y-skip-link",
      category: "Accessibility",
      severity: "suggestion",
      confidence: "high",
      title: "Add Bengali skip-to-content landmark link",
      message: "Keyboard users must tab through 7 navigation items before reaching main content.",
      explanation:
        "While ARIA landmarks are present, providing a visually-hidden skip link in Bengali ('মূল বিষয়বস্তুতে যান') improves keyboard navigation.",
      recommendation: "Insert an accessible skip link as the first focusable element inside <body>.",
      selector: "header.site-nav > nav",
      evidence: "<nav aria-label=\"প্রধান নেভিগেশন\">... (7 links)</nav>",
      codeFix: `<a href="#main-content" className="sr-only focus:not-sr-only">\n  মূল বিষয়বস্তুতে যান\n</a>`,
    },
    {
      id: "h-2",
      ruleId: "l10n-date-format",
      category: "Localization",
      severity: "suggestion",
      confidence: "medium",
      title: "Footer timestamp uses ISO English format",
      message: "One footer metadata string renders 'Updated: 2026-11-20' instead of Bengali numerals.",
      explanation:
        "The rest of the portal uses Bengali numerals (২০২৬). Standardizing the footer timestamp keeps localization consistent.",
      recommendation: "Format dates using Intl.DateTimeFormat('bn-BD', { dateStyle: 'long' }).",
      selector: "footer .last-updated",
      evidence: "সর্বশেষ হালনাগাদ: 2026-11-20",
      codeFix: `new Intl.DateTimeFormat("bn-BD", { dateStyle: "long" }).format(date)`,
      requiresHumanReview: true,
    },
  ],
};

const PROBLEMATIC_REPORT: AuditReport = {
  id: "scan-fixture-b",
  fixtureKey: "problematic",
  url: "https://legacy-bangla-portal.demo",
  siteTitle: "দৈনিক বাংলা সংবাদ ও তথ্য কেন্দ্র",
  languageMode: "bn",
  detectedHtmlLang: "en",
  overallScore: 48,
  scanDurationMs: 4120,
  scannedAt: "2026-11-25T01:52:00Z",
  fontStackDetected: ["Arial", "Helvetica", "sans-serif"],
  bengaliFontLoaded: false,
  unicodeHealth: {
    replacementChars: 6,
    nfdSequences: 14,
    numeralStyle: "mixed",
  },
  categoryScores: [
    { category: "Bengali Unicode", score: 38, passed: 3, issues: 3 },
    { category: "Accessibility", score: 42, passed: 6, issues: 4 },
    { category: "Typography & Fonts", score: 50, passed: 2, issues: 2 },
    { category: "Responsive Layout", score: 46, passed: 4, issues: 2 },
    { category: "Localization", score: 64, passed: 5, issues: 1 },
  ],
  viewports: [
    {
      profile: "mobile",
      label: "Mobile",
      widthPx: 360,
      overflowDetected: true,
      clippedElements: 3,
      status: "fail",
      highlights: [
        {
          id: "hl-m-1",
          label: "Horizontal Overflow (+42px)",
          severity: "critical",
          xPct: 68,
          yPct: 14,
          wPct: 30,
          hPct: 12,
          findingId: "p-resp-1",
        },
        {
          id: "hl-m-2",
          label: "U+FFFD Glyph Corruption",
          severity: "critical",
          xPct: 8,
          yPct: 34,
          wPct: 84,
          hPct: 16,
          findingId: "p-bn-1",
        },
        {
          id: "hl-m-3",
          label: "Clipped Bengali CTA",
          severity: "warning",
          xPct: 12,
          yPct: 72,
          wPct: 76,
          hPct: 12,
          findingId: "p-resp-2",
        },
      ],
    },
    {
      profile: "tablet",
      label: "Tablet",
      widthPx: 768,
      overflowDetected: false,
      clippedElements: 1,
      status: "warn",
      highlights: [
        {
          id: "hl-t-1",
          label: "U+FFFD Glyph Corruption",
          severity: "critical",
          xPct: 10,
          yPct: 30,
          wPct: 80,
          hPct: 16,
          findingId: "p-bn-1",
        },
      ],
    },
    {
      profile: "desktop",
      label: "Desktop",
      widthPx: 1440,
      overflowDetected: false,
      clippedElements: 0,
      status: "warn",
      highlights: [
        {
          id: "hl-d-1",
          label: "Missing Bengali Webfont",
          severity: "warning",
          xPct: 8,
          yPct: 24,
          wPct: 64,
          hPct: 18,
          findingId: "p-font-1",
        },
      ],
    },
  ],
  findings: [
    {
      id: "p-bn-1",
      ruleId: "bn-replacement-char",
      category: "Bengali Unicode",
      severity: "critical",
      confidence: "high",
      title: "Unicode replacement characters (U+FFFD) detected in headlines",
      message: "Found 6 occurrences of '' inside primary article headlines and card summaries.",
      explanation:
        "Replacement characters indicate broken UTF-8 decoding or truncated legacy Bijoy/ANSI-to-Unicode conversion, making Bengali words unreadable.",
      recommendation: "Ensure UTF-8 encoding end-to-end (DB, API, and <meta charset=\"utf-8\">) and re-normalize source text.",
      selector: "main article.lead-story > h2.headline",
      evidence: "বাংলাদেশের ডিজিটাল সেবা উন্নয় নতুন দক্ষেপ",
      codeFix: `<meta charSet="utf-8" />\n// Re-encode source string cleanly as UTF-8 NFC`,
      viewport: "mobile",
    },
    {
      id: "p-l10n-1",
      ruleId: "l10n-html-lang-mismatch",
      category: "Localization",
      severity: "critical",
      confidence: "high",
      title: "HTML lang=\"en\" declared on a predominantly Bengali page",
      message: "94% of visible text nodes are Bengali script, but <html lang=\"en\"> is set.",
      explanation:
        "Screen readers use the document lang attribute to select pronunciation engines. Declaring 'en' causes assistive tech to misread Bengali text.",
      recommendation: "Set <html lang=\"bn\"> on the root document element.",
      selector: "html",
      evidence: `<html lang="en" dir="ltr">`,
      codeFix: `<html lang="bn">`,
    },
    {
      id: "p-a11y-1",
      ruleId: "a11y-missing-alt",
      category: "Accessibility",
      severity: "critical",
      confidence: "high",
      title: "Hero news images lack alternative text",
      message: "4 <img> elements in the featured news grid have no alt attribute.",
      explanation:
        "Detected via axe-core (image-alt). Screen reader users receive only the raw image filename.",
      recommendation: "Provide descriptive Bengali alt text summarizing each photo, or alt=\"\" if purely decorative.",
      selector: ".news-grid img.thumb",
      evidence: `<img src="/uploads/banner-2026.jpg" class="thumb" />`,
      codeFix: `<img src="/uploads/banner-2026.jpg" alt="জাতীয় স্মৃতিসৌধে স্বাধীনতা দিবসের শ্রদ্ধাঞ্জলি" />`,
    },
    {
      id: "p-a11y-2",
      ruleId: "a11y-unlabelled-input",
      category: "Accessibility",
      severity: "critical",
      confidence: "high",
      title: "Newsletter & search inputs lack programmatic labels",
      message: "2 form controls rely solely on placeholder text without <label> or aria-label.",
      explanation:
        "Placeholders disappear on focus and are not reliably announced by all screen readers.",
      recommendation: "Associate a visible <label> or add aria-label in Bengali.",
      selector: "form.search-bar input[type='search']",
      evidence: `<input type="search" placeholder="খুঁজুন..." />`,
      codeFix: `<label htmlFor="site-search" className="sr-only">সাইটে খুঁজুন</label>\n<input id="site-search" type="search" placeholder="খুঁজুন..." />`,
    },
    {
      id: "p-resp-1",
      ruleId: "resp-horizontal-overflow",
      category: "Responsive Layout",
      severity: "critical",
      confidence: "high",
      title: "Horizontal page overflow (+42px) at 360px mobile viewport",
      message: "Breaking news ticker container exceeds 360px viewport width, forcing horizontal scroll.",
      explanation:
        "A fixed min-width: 402px on .breaking-ticker pushes the document scrollWidth to 402px on standard mobile screens.",
      recommendation: "Replace fixed pixel widths with max-w-full and overflow-x-hidden or flex-wrap.",
      selector: "section.breaking-ticker",
      evidence: "document.documentElement.scrollWidth (402px) > clientWidth (360px)",
      codeFix: `.breaking-ticker {\n  width: 100%;\n  max-width: 100%;\n  overflow-x: hidden;\n}`,
      viewport: "mobile",
    },
    {
      id: "p-bn-2",
      ruleId: "bn-unicode-nfd",
      category: "Bengali Unicode",
      severity: "warning",
      confidence: "medium",
      title: "Inconsistent Unicode normalization (NFD decomposed conjuncts)",
      message: "14 Bengali words contain decomposed nukta/vowel sequences instead of NFC.",
      explanation:
        "Decomposed sequences (e.g. ড + ় instead of ড়) can cause search mismatches and broken glyph shaping in older font renderers.",
      recommendation: "Normalize CMS text pipelines using String.prototype.normalize('NFC').",
      selector: ".article-body p",
      evidence: `"বাংলার ড\\u09BC\\u09C7লো" (NFD) vs "বাংলার ড়েলো" (NFC)`,
      codeFix: `const normalized = rawBengaliText.normalize("NFC");`,
    },
    {
      id: "p-font-1",
      ruleId: "typo-missing-bengali-font",
      category: "Typography & Fonts",
      severity: "warning",
      confidence: "medium",
      title: "No Bengali-capable webfont in declared CSS font-family stack",
      message: "Computed font-family is 'Arial, Helvetica, sans-serif'. Relying on OS fallback.",
      explanation:
        "While the OS may fall back to Vrinda or Noto Sans Bengali, metrics (line-height, x-height, ascenders) vary unpredictably across devices.",
      recommendation: "Include a tested Bengali webfont such as 'Noto Sans Bengali' or 'Hind Siliguri' in your font stack.",
      selector: "body",
      evidence: `font-family: Arial, Helvetica, sans-serif;`,
      codeFix: `font-family: "Noto Sans Bengali", "Hind Siliguri", system-ui, sans-serif;`,
      viewport: "desktop",
    },
    {
      id: "p-resp-2",
      ruleId: "resp-text-clipping",
      category: "Responsive Layout",
      severity: "warning",
      confidence: "high",
      title: "Bengali CTA button label clipped at 360px",
      message: "Button 'বিস্তারিত সংবাদ পড়ুন এবং শেয়ার করুন' is truncated with overflow: hidden.",
      explanation:
        "Bengali matras (কার) and conjuncts require slightly taller line-height (~1.5) and flexible button padding on narrow screens.",
      recommendation: "Allow multi-line wrapping or concise button labels on mobile viewports.",
      selector: ".card-actions button.read-more",
      evidence: "scrollWidth: 298px > clientWidth: 230px (overflow: hidden)",
      codeFix: `.read-more {\n  white-space: normal;\n  line-height: 1.5;\n  padding-block: 0.625rem;\n}`,
      viewport: "mobile",
    },
    {
      id: "p-a11y-3",
      ruleId: "a11y-color-contrast",
      category: "Accessibility",
      severity: "warning",
      confidence: "high",
      title: "Insufficient contrast on muted Bengali timestamp",
      message: "Contrast ratio 3.1:1 fails WCAG AA (4.5:1 required for small text).",
      explanation:
        "Light gray #9ca3af on #f8fafc background reduces legibility for thin Bengali strokes.",
      recommendation: "Darken text color to at least #475569 for >= 4.5:1 contrast.",
      selector: ".meta-row span.time",
      evidence: "color: #9ca3af on background: #f8fafc (3.12:1)",
      codeFix: `color: #475569; /* 7.5:1 contrast */`,
    },
    {
      id: "p-bn-3",
      ruleId: "bn-numeral-consistency",
      category: "Bengali Unicode",
      severity: "suggestion",
      confidence: "low",
      title: "Mixed Bengali and Latin numerals in statistics widget",
      message: "Found 'মোট পাঠক: 14,520 জন (আজ ২৩৪ জন)' mixing Latin and Bengali digits.",
      explanation:
        "In Bangla-only mode, mixing digit systems can feel jarring. Configure numeral rules if Latin digits are intentional for IDs/codes.",
      recommendation: "Convert display counts to Bengali numerals for consistency.",
      selector: ".stats-card .counter",
      evidence: "মোট পাঠক: 14,520 জন (আজ ২৩৪ জন)",
      requiresHumanReview: true,
    },
  ],
};

const BILINGUAL_REPORT: AuditReport = {
  id: "scan-fixture-c",
  fixtureKey: "bilingual",
  url: "https://dhaka-mart-bilingual.demo",
  siteTitle: "DhakaMart — ঢাকা মার্ট | Bilingual Storefront",
  languageMode: "bilingual",
  detectedHtmlLang: "bn",
  overallScore: 79,
  scanDurationMs: 3290,
  scannedAt: "2026-11-25T01:50:00Z",
  fontStackDetected: ["Hind Siliguri", "Inter", "sans-serif"],
  bengaliFontLoaded: true,
  unicodeHealth: {
    replacementChars: 0,
    nfdSequences: 2,
    numeralStyle: "mixed",
  },
  categoryScores: [
    { category: "Bengali Unicode", score: 88, passed: 7, issues: 1 },
    { category: "Accessibility", score: 76, passed: 10, issues: 2 },
    { category: "Typography & Fonts", score: 85, passed: 5, issues: 1 },
    { category: "Responsive Layout", score: 82, passed: 8, issues: 1 },
    { category: "Localization", score: 66, passed: 4, issues: 2 },
  ],
  viewports: [
    {
      profile: "mobile",
      label: "Mobile",
      widthPx: 360,
      overflowDetected: false,
      clippedElements: 1,
      status: "warn",
      highlights: [
        {
          id: "hl-bi-1",
          label: "Untranslated Placeholder",
          severity: "warning",
          xPct: 10,
          yPct: 48,
          wPct: 80,
          hPct: 14,
          findingId: "bi-1",
        },
      ],
    },
    {
      profile: "tablet",
      label: "Tablet",
      widthPx: 768,
      overflowDetected: false,
      clippedElements: 0,
      status: "pass",
      highlights: [],
    },
    {
      profile: "desktop",
      label: "Desktop",
      widthPx: 1440,
      overflowDetected: false,
      clippedElements: 0,
      status: "pass",
      highlights: [],
    },
  ],
  findings: [
    {
      id: "bi-1",
      ruleId: "l10n-untranslated-placeholder",
      category: "Localization",
      severity: "warning",
      confidence: "medium",
      title: "Untranslated English placeholder inside Bengali checkout form",
      message: "Input labeled 'ডেলিভারি ঠিকানা' still uses placeholder='Enter street address...'.",
      explanation:
        "In bilingual mode, mixing English brand names is expected, but form instructions inside a Bengali section should be localized.",
      recommendation: "Translate the placeholder to Bengali: 'বাড়ি ও রাস্তার ঠিকানা লিখুন...'.",
      selector: "#checkout-address",
      evidence: `<label>ডেলিভারি ঠিকানা</label><input placeholder="Enter street address..." />`,
      codeFix: `placeholder="বাড়ি ও রাস্তার ঠিকানা লিখুন..."`,
      viewport: "mobile",
      requiresHumanReview: true,
    },
    {
      id: "bi-2",
      ruleId: "a11y-missing-passage-lang",
      category: "Accessibility",
      severity: "warning",
      confidence: "high",
      title: "English product spec block lacks lang=\"en\" attribute",
      message: "Multi-sentence English warranty terms appear inside <html lang=\"bn\"> without passage lang.",
      explanation:
        "Screen readers configured for Bengali will attempt to read English paragraphs with Bengali phonetics unless wrapped in lang=\"en\".",
      recommendation: "Add lang=\"en\" to containers holding full English sentences.",
      selector: ".product-specs .warranty-en",
      evidence: `<div class="warranty-en">1 Year Official Brand Warranty...</div>`,
      codeFix: `<div className="warranty-en" lang="en">1 Year Official Brand Warranty...</div>`,
    },
    {
      id: "bi-3",
      ruleId: "l10n-currency-format",
      category: "Localization",
      severity: "suggestion",
      confidence: "low",
      title: "Inconsistent currency symbol placement (৳ vs BDT)",
      message: "Product cards show '৳১,২৫০' while cart summary displays 'BDT 1250'.",
      explanation:
        "Bilingual storefronts benefit from a consistent currency convention across cards and checkout totals.",
      recommendation: "Standardize on '৳' or 'BDT' per selected locale.",
      selector: ".cart-summary .total-price",
      evidence: "সর্বমোট: BDT 1250",
      requiresHumanReview: true,
    },
    {
      id: "bi-4",
      ruleId: "typo-line-height-bn",
      category: "Typography & Fonts",
      severity: "suggestion",
      confidence: "medium",
      title: "Tight line-height (1.15) on Bengali badge labels",
      message: "Descending Bengali kar/matra glyphs touch container borders in .promo-badge.",
      explanation:
        "Inter's compact line-height works for Latin caps but clips Bengali vowel signs (ু, ূ, ৃ).",
      recommendation: "Increase line-height to 1.45 for elements containing Bengali text.",
      selector: ".promo-badge",
      evidence: `line-height: 1.15; font-size: 12px;`,
      codeFix: `.promo-badge { line-height: 1.45; }`,
    },
  ],
};

export function getAuditReport(
  fixtureParam?: string | null,
  urlParam?: string | null,
  langParam?: string | null
): AuditReport {
  const lang: LanguageMode =
    langParam === "bn" || langParam === "en" || langParam === "bilingual"
      ? langParam
      : "bn";

  if (fixtureParam === "healthy") {
    return { ...HEALTHY_REPORT, languageMode: lang };
  }
  if (fixtureParam === "bilingual") {
    return { ...BILINGUAL_REPORT, languageMode: lang };
  }
  if (fixtureParam === "problematic") {
    return { ...PROBLEMATIC_REPORT, languageMode: lang };
  }

  if (urlParam && urlParam.trim().length > 0) {
    const cleanUrl = urlParam.trim();
    const base = lang === "bilingual" ? BILINGUAL_REPORT : PROBLEMATIC_REPORT;
    return {
      ...base,
      id: `scan-custom-${cleanUrl.length}`,
      fixtureKey: "custom",
      url: cleanUrl,
      siteTitle: `Live Diagnostic Preview — ${cleanUrl.replace(/^https?:\/\//, "")}`,
      languageMode: lang,
    };
  }

  return PROBLEMATIC_REPORT;
}
