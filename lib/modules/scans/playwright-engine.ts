import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import type {
  AuditCategory,
  AuditFinding,
  AuditReport,
  CategoryScore,
  FindingSeverity,
  LanguageMode,
  ViewportProfile,
  ViewportSnapshot,
} from "@/types/audit";
import type { ScanEngine, ScanEngineInput } from "./engine";
import { assertSafePublicUrl } from "./ssrf";

const SYSTEM_BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/brave-browser",
  "/usr/bin/brave",
  "/usr/bin/microsoft-edge",
].filter((p): p is string => Boolean(p));

function resolveChromiumExecutable(): string | undefined {
  try {
    const pwDefault = chromium.executablePath();
    if (pwDefault && existsSync(pwDefault)) {
      return pwDefault;
    }
  } catch {
    // Ignore and fall back to system browser detection
  }
  for (const candidate of SYSTEM_BROWSER_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

let cachedAxeSource: string | null = null;
function getAxeScriptSource(): string {
  if (!cachedAxeSource) {
    const axePath = join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
    cachedAxeSource = readFileSync(axePath, "utf8");
  }
  return cachedAxeSource;
}

const VIEWPORT_CONFIGS: {
  profile: ViewportProfile;
  label: string;
  widthPx: number;
  heightPx: number;
}[] = [
  { profile: "desktop", label: "Desktop", widthPx: 1440, heightPx: 900 },
  { profile: "tablet", label: "Tablet", widthPx: 768, heightPx: 1024 },
  { profile: "mobile", label: "Mobile", widthPx: 360, heightPx: 800 },
];

interface DomAnalysisPayload {
  siteTitle: string;
  detectedHtmlLang: string | null;
  fontStackDetected: string[];
  bengaliFontLoaded: boolean;
  bengaliCharCount: number;
  latinCharCount: number;
  unicodeHealth: {
    replacementChars: number;
    nfdSequences: number;
    numeralStyle: "bengali" | "latin" | "mixed";
  };
  replacementFindings: {
    selector: string;
    evidence: string;
    count: number;
    box: { xPct: number; yPct: number; wPct: number; hPct: number } | null;
  }[];
  nfdFindings: {
    selector: string;
    evidence: string;
    count: number;
  }[];
  numeralSample: {
    bengaliCount: number;
    latinCount: number;
    mixedSampleSelector?: string;
    mixedSampleEvidence?: string;
  };
  tightLineHeightElements: {
    selector: string;
    evidence: string;
    ratio: number;
  }[];
  untranslatedPlaceholders: {
    selector: string;
    evidence: string;
    placeholder: string;
    box: { xPct: number; yPct: number; wPct: number; hPct: number } | null;
  }[];
  unmarkedPassages: {
    selector: string;
    evidence: string;
    expectedLang: "bn" | "en";
  }[];
}

interface ViewportDomSweep {
  overflowDetected: boolean;
  overflowPx: number;
  overflowCulprit?: {
    selector: string;
    evidence: string;
    box: { xPct: number; yPct: number; wPct: number; hPct: number };
  };
  clippedElementsCount: number;
  clippedItems: {
    selector: string;
    text: string;
    evidence: string;
    box: { xPct: number; yPct: number; wPct: number; hPct: number };
  }[];
}

interface AxeViolationNode {
  html: string;
  target: unknown[];
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  impact?: "minor" | "moderate" | "serious" | "critical" | null;
  help: string;
  description: string;
  helpUrl?: string;
  nodes: AxeViolationNode[];
}

export const playwrightEngine: ScanEngine = {
  async run(input: ScanEngineInput): Promise<AuditReport> {
    const startedAt = Date.now();
    const safeUrl = await assertSafePublicUrl(input.url);
    const targetUrl = safeUrl.toString();
    const languageMode: LanguageMode = input.languageMode ?? "bn";
    const enabled = new Set(
      input.enabledModules && input.enabledModules.length > 0
        ? input.enabledModules
        : ["unicode", "axe", "fonts", "viewports"]
    );

    const executablePath = resolveChromiumExecutable();
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 BanglaUIDoctor/0.1",
        ignoreHTTPSErrors: false,
      });

      // Intercept requests: block non-HTTP schemes, heavy media streams, and SSRF attempts
      await context.route("**/*", async (route) => {
        const req = route.request();
        const reqUrl = req.url();
        const resourceType = req.resourceType();

        if (resourceType === "media" || resourceType === "websocket") {
          return route.abort();
        }
        if (reqUrl.startsWith("data:") || reqUrl.startsWith("blob:")) {
          return route.continue();
        }
        try {
          await assertSafePublicUrl(reqUrl);
          return route.continue();
        } catch {
          return route.abort("accessdenied");
        }
      });

      const page = await context.newPage();
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });

      // Wait briefly for webfonts and client hydration
      await page.waitForTimeout(900);

      // 1. Run primary DOM analysis for Bengali Unicode, Typography, and Localization
      const domData: DomAnalysisPayload = await page.evaluate(() => {
        const BENGALI_CHAR_RE = /[\u0980-\u09FF]/;
        const BENGALI_GLOBAL_RE = /[\u0980-\u09FF]/g;
        const LATIN_GLOBAL_RE = /[A-Za-z]/g;
        const BENGALI_DIGIT_RE = /[০-৯]/g;
        const LATIN_DIGIT_RE = /[0-9]/g;
        const KNOWN_BENGALI_FONTS = [
          "noto sans bengali",
          "noto serif bengali",
          "hind siliguri",
          "solaimanlipi",
          "kalpurush",
          "anek bangla",
          "tiro bangla",
          "baloo da",
          "baloo da 2",
          "atma",
          "galada",
          "mina",
          "kohinoor bangla",
          "vrinda",
          "nirmala ui",
          "siyam rupali",
          "mukti",
          "ekushey",
          "charukola",
          "adorsholipi",
        ];

        function buildSelector(el: Element | null): string {
          if (!el) return "body";
          if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
          const cls =
            typeof el.className === "string"
              ? el.className
                  .trim()
                  .split(/\s+/)
                  .filter((c) => c && !c.includes(":") && c.length < 28)
                  .slice(0, 2)
              : [];
          const self =
            cls.length > 0
              ? `${el.tagName.toLowerCase()}.${cls.join(".")}`
              : el.tagName.toLowerCase();
          const parent = el.parentElement;
          if (parent && parent.tagName !== "BODY" && parent.tagName !== "HTML") {
            const pTag = parent.id
              ? `${parent.tagName.toLowerCase()}#${parent.id}`
              : parent.tagName.toLowerCase();
            return `${pTag} > ${self}`;
          }
          return self;
        }

        function toNormalizedBox(el: Element | null) {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const vw = Math.max(window.innerWidth, 1);
          const vh = Math.max(window.innerHeight, 1);
          if (rect.width <= 0 || rect.height <= 0) return null;
          const xPct = Math.max(4, Math.min(82, Math.round((rect.left / vw) * 100)));
          const yPct = Math.max(8, Math.min(78, Math.round((rect.top / vh) * 100)));
          const wPct = Math.max(14, Math.min(92 - xPct, Math.round((rect.width / vw) * 100)));
          const hPct = Math.max(10, Math.min(88 - yPct, Math.round((rect.height / vh) * 100)));
          return { xPct, yPct, wPct, hPct };
        }

        const htmlEl = document.documentElement;
        const rawLang = htmlEl.getAttribute("lang");
        const detectedHtmlLang = rawLang && rawLang.trim().length > 0 ? rawLang.trim() : null;
        const siteTitle =
          document.title?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          window.location.hostname;

        // Font stack detection from body & primary heading/text nodes
        const fontCandidates = new Set<string>();
        const fontSampleNodes = [
          document.body,
          document.querySelector("h1"),
          document.querySelector("h2"),
          document.querySelector("p"),
          document.querySelector("main"),
        ].filter((n): n is HTMLElement => Boolean(n));

        for (const node of fontSampleNodes) {
          const fam = window.getComputedStyle(node).fontFamily;
          if (fam) {
            for (const part of fam.split(",")) {
              const cleaned = part.replace(/['"]/g, "").trim();
              if (cleaned) fontCandidates.add(cleaned);
            }
          }
        }
        const fontStackDetected = Array.from(fontCandidates).slice(0, 6);
        const lowerFonts = fontStackDetected.map((f) => f.toLowerCase());
        let bengaliFontLoaded = lowerFonts.some((f) =>
          KNOWN_BENGALI_FONTS.some((kb) => f.includes(kb))
        );

        // Also inspect document.fonts if available
        try {
          if (document.fonts && typeof document.fonts.forEach === "function") {
            document.fonts.forEach((fontFace) => {
              const fam = fontFace.family.replace(/['"]/g, "").toLowerCase();
              if (KNOWN_BENGALI_FONTS.some((kb) => fam.includes(kb))) {
                bengaliFontLoaded = true;
                if (!fontStackDetected.some((f) => f.toLowerCase() === fam)) {
                  fontStackDetected.unshift(fontFace.family.replace(/['"]/g, ""));
                }
              }
            });
          }
        } catch {
          // Ignore font set iteration errors
        }

        // Walk visible text nodes
        let replacementChars = 0;
        let nfdSequences = 0;
        let bengaliCharCount = 0;
        let latinCharCount = 0;
        let bengaliDigitCount = 0;
        let latinDigitCount = 0;
        let mixedSampleSelector: string | undefined;
        let mixedSampleEvidence: string | undefined;

        const replacementFindings: DomAnalysisPayload["replacementFindings"] = [];
        const nfdFindings: DomAnalysisPayload["nfdFindings"] = [];
        const tightLineHeightElements: DomAnalysisPayload["tightLineHeightElements"] = [];
        const unmarkedPassages: DomAnalysisPayload["unmarkedPassages"] = [];
        const checkedLineHeightEls = new Set<Element>();

        const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
        let currentNode: Node | null = walker.nextNode();

        while (currentNode) {
          const parent = currentNode.parentElement;
          const text = currentNode.nodeValue?.trim() ?? "";
          currentNode = walker.nextNode();

          if (!parent || !text) continue;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "SVG") {
            continue;
          }

          const bnMatches = text.match(BENGALI_GLOBAL_RE);
          const latMatches = text.match(LATIN_GLOBAL_RE);
          if (bnMatches) bengaliCharCount += bnMatches.length;
          if (latMatches) latinCharCount += latMatches.length;

          // 1. Replacement char check (U+FFFD)
          if (text.includes("\uFFFD")) {
            const count = (text.match(/\uFFFD/g) || []).length;
            replacementChars += count;
            if (replacementFindings.length < 3) {
              replacementFindings.push({
                selector: buildSelector(parent),
                evidence: text.slice(0, 140),
                count,
                box: toNormalizedBox(parent),
              });
            }
          }

          // 2. NFD normalization check on Bengali text
          if (BENGALI_CHAR_RE.test(text)) {
            const nfc = text.normalize("NFC");
            if (text !== nfc) {
              nfdSequences += 1;
              if (nfdFindings.length < 3) {
                nfdFindings.push({
                  selector: buildSelector(parent),
                  evidence: text.slice(0, 120),
                  count: 1,
                });
              }
            }

            // 3. Numeral check inside Bengali text blocks
            const bnDigits = (text.match(BENGALI_DIGIT_RE) || []).length;
            const enDigits = (text.match(LATIN_DIGIT_RE) || []).length;
            bengaliDigitCount += bnDigits;
            latinDigitCount += enDigits;

            if (bnDigits > 0 && enDigits > 0 && !mixedSampleEvidence) {
              mixedSampleSelector = buildSelector(parent);
              mixedSampleEvidence = text.slice(0, 140);
            }

            // 4. Tight line-height check on Bengali elements
            if (!checkedLineHeightEls.has(parent) && tightLineHeightElements.length < 3 && text.length >= 10) {
              checkedLineHeightEls.add(parent);
              const style = window.getComputedStyle(parent);
              const fontSize = parseFloat(style.fontSize);
              const lineHeight = parseFloat(style.lineHeight);
              if (fontSize > 0 && !Number.isNaN(lineHeight) && lineHeight > 0) {
                const ratio = Number((lineHeight / fontSize).toFixed(2));
                if (ratio < 1.32) {
                  tightLineHeightElements.push({
                    selector: buildSelector(parent),
                    evidence: `line-height: ${style.lineHeight}; font-size: ${style.fontSize} (ratio ${ratio}) — "${text.slice(0, 55)}"`,
                    ratio,
                  });
                }
              }
            }
          }

          // 5. Unmarked secondary language passage check
          if (unmarkedPassages.length < 2 && text.length >= 45) {
            const hasLangAttr = Boolean(parent.closest("[lang]"));
            const closestLang = parent.closest("[lang]")?.getAttribute("lang")?.toLowerCase() ?? "";
            const bnLen = bnMatches?.length ?? 0;
            const latLen = latMatches?.length ?? 0;

            if (
              detectedHtmlLang?.toLowerCase().startsWith("bn") &&
              latLen > 35 &&
              bnLen === 0 &&
              (!hasLangAttr || closestLang.startsWith("bn"))
            ) {
              unmarkedPassages.push({
                selector: buildSelector(parent),
                evidence: `<${parent.tagName.toLowerCase()}>${text.slice(0, 110)}</${parent.tagName.toLowerCase()}>`,
                expectedLang: "en",
              });
            } else if (
              detectedHtmlLang?.toLowerCase().startsWith("en") &&
              bnLen > 25 &&
              latLen < 10 &&
              closestLang.startsWith("en")
            ) {
              unmarkedPassages.push({
                selector: buildSelector(parent),
                evidence: `<${parent.tagName.toLowerCase()}>${text.slice(0, 110)}</${parent.tagName.toLowerCase()}>`,
                expectedLang: "bn",
              });
            }
          }
        }

        // 6. Untranslated English placeholders on inputs
        const untranslatedPlaceholders: DomAnalysisPayload["untranslatedPlaceholders"] = [];
        const inputs = Array.from(
          document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            "input[placeholder], textarea[placeholder]"
          )
        );
        for (const inp of inputs) {
          const ph = inp.getAttribute("placeholder")?.trim() ?? "";
          if (ph.length >= 4 && /[A-Za-z]{3,}/.test(ph) && !BENGALI_CHAR_RE.test(ph)) {
            if (untranslatedPlaceholders.length < 3) {
              untranslatedPlaceholders.push({
                selector: buildSelector(inp),
                evidence: inp.outerHTML.slice(0, 160),
                placeholder: ph,
                box: toNormalizedBox(inp),
              });
            }
          }
        }

        const numeralStyle: "bengali" | "latin" | "mixed" =
          bengaliDigitCount > 0 && latinDigitCount > 0
            ? "mixed"
            : bengaliDigitCount > 0
            ? "bengali"
            : "latin";

        return {
          siteTitle,
          detectedHtmlLang,
          fontStackDetected:
            fontStackDetected.length > 0 ? fontStackDetected : ["system-ui", "sans-serif"],
          bengaliFontLoaded,
          bengaliCharCount,
          latinCharCount,
          unicodeHealth: {
            replacementChars,
            nfdSequences,
            numeralStyle,
          },
          replacementFindings,
          nfdFindings,
          numeralSample: {
            bengaliCount: bengaliDigitCount,
            latinCount: latinDigitCount,
            mixedSampleSelector,
            mixedSampleEvidence,
          },
          tightLineHeightElements,
          untranslatedPlaceholders,
          unmarkedPassages,
        };
      });

      // 2. Run axe-core Accessibility Audit if enabled
      let axeViolations: AxeViolation[] = [];
      if (enabled.has("axe")) {
        try {
          await page.addScriptTag({ content: getAxeScriptSource() });
          axeViolations = await page.evaluate(async () => {
            const w = window as unknown as {
              axe?: {
                run: (
                  ctx: Document,
                  opts: Record<string, unknown>
                ) => Promise<{ violations: AxeViolation[] }>;
              };
            };
            if (!w.axe) return [];
            const res = await w.axe.run(document, {
              resultTypes: ["violations"],
            });
            return res.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              description: v.description,
              helpUrl: v.helpUrl,
              nodes: v.nodes.slice(0, 5).map((n) => ({
                html: n.html,
                target: n.target,
                failureSummary: n.failureSummary,
              })),
            }));
          });
        } catch {
          // Non-fatal if target CSP blocks inline eval; other rules still run
        }
      }

      // 3. Multi-viewport Responsive Layout Sweep (1440px, 768px, 360px)
      const viewportResults = new Map<ViewportProfile, ViewportDomSweep>();
      for (const vp of VIEWPORT_CONFIGS) {
        await page.setViewportSize({ width: vp.widthPx, height: vp.heightPx });
        await page.waitForTimeout(220);

        const sweep: ViewportDomSweep = await page.evaluate((vpWidth: number) => {
          function buildSelector(el: Element | null): string {
            if (!el) return "body";
            if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
            const cls =
              typeof el.className === "string"
                ? el.className
                    .trim()
                    .split(/\s+/)
                    .filter((c) => c && !c.includes(":") && c.length < 28)
                    .slice(0, 2)
                : [];
            return cls.length > 0
              ? `${el.tagName.toLowerCase()}.${cls.join(".")}`
              : el.tagName.toLowerCase();
          }

          function toBox(rect: DOMRect) {
            const vw = Math.max(window.innerWidth, 1);
            const vh = Math.max(window.innerHeight, 1);
            const xPct = Math.max(4, Math.min(80, Math.round((rect.left / vw) * 100)));
            const yPct = Math.max(10, Math.min(76, Math.round((rect.top / vh) * 100)));
            const wPct = Math.max(16, Math.min(92 - xPct, Math.round((rect.width / vw) * 100)));
            const hPct = Math.max(10, Math.min(88 - yPct, Math.round((rect.height / vh) * 100)));
            return { xPct, yPct, wPct, hPct };
          }

          const docEl = document.documentElement;
          const docScrollWidth = Math.max(
            docEl.scrollWidth,
            document.body ? document.body.scrollWidth : 0
          );
          const overflowPx = Math.max(0, docScrollWidth - vpWidth);
          const overflowDetected = overflowPx > 2;

          let overflowCulprit: ViewportDomSweep["overflowCulprit"];
          const clippedItems: ViewportDomSweep["clippedItems"] = [];

          const allElements = Array.from(
            document.querySelectorAll<HTMLElement>(
              "header, nav, main, section, article, div, button, a, span, h1, h2, h3, p, table, pre"
            )
          );

          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;

            if (overflowDetected && !overflowCulprit && rect.right > vpWidth + 4) {
              overflowCulprit = {
                selector: buildSelector(el),
                evidence: `${buildSelector(el)} right edge (${Math.round(
                  rect.right
                )}px) > viewport (${vpWidth}px); document.scrollWidth=${docScrollWidth}px`,
                box: toBox(rect),
              };
            }

            // Check clipped interactive / text controls
            const tag = el.tagName;
            if (
              tag === "BUTTON" ||
              tag === "A" ||
              tag === "H1" ||
              tag === "H2" ||
              tag === "H3" ||
              tag === "SPAN" ||
              tag === "LABEL"
            ) {
              const style = window.getComputedStyle(el);
              const isClippedOverflow =
                style.overflowX === "hidden" ||
                style.overflowX === "clip" ||
                style.textOverflow === "ellipsis";
              if (
                isClippedOverflow &&
                el.clientWidth > 20 &&
                el.scrollWidth > el.clientWidth + 6
              ) {
                const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
                if (txt.length >= 3 && clippedItems.length < 5) {
                  clippedItems.push({
                    selector: buildSelector(el),
                    text: txt.slice(0, 60),
                    evidence: `scrollWidth: ${el.scrollWidth}px > clientWidth: ${el.clientWidth}px (overflow-x: ${style.overflowX}) on "${txt.slice(0, 50)}"`,
                    box: toBox(rect),
                  });
                }
              }
            }
          }

          return {
            overflowDetected,
            overflowPx,
            overflowCulprit,
            clippedElementsCount: clippedItems.length,
            clippedItems,
          };
        }, vp.widthPx);

        viewportResults.set(vp.profile, sweep);
      }

      // 4. Synthesize structured AuditFindings & ViewportSnapshots
      const findings: AuditFinding[] = [];
      let findingCounter = 1;
      const nextId = (prefix: string) => `${prefix}-${findingCounter++}`;

      const hasBengaliText = domData.bengaliCharCount > 0;
      const totalAlphaChars = domData.bengaliCharCount + domData.latinCharCount;
      const bengaliRatio =
        totalAlphaChars > 0 ? domData.bengaliCharCount / totalAlphaChars : 0;

      // --- MODULE A: Bengali Unicode ---
      if (enabled.has("unicode")) {
        if (domData.unicodeHealth.replacementChars > 0) {
          const sample = domData.replacementFindings[0];
          findings.push({
            id: nextId("bn"),
            ruleId: "bn-replacement-char",
            category: "Bengali Unicode",
            severity: "critical",
            confidence: "high",
            title: "Unicode replacement characters (U+FFFD) detected in visible text",
            message: `Found ${domData.unicodeHealth.replacementChars} occurrence(s) of '\uFFFD' inside rendered page content.`,
            explanation:
              "Replacement characters indicate corrupted UTF-8 byte sequences or broken Bijoy/ANSI-to-Unicode conversion, leaving Bengali words unreadable.",
            recommendation:
              "Serve the document as UTF-8 (<meta charset=\"utf-8\">) and re-encode corrupted strings in your database or CMS as valid UTF-8 NFC.",
            selector: sample?.selector ?? "body",
            evidence: sample?.evidence ?? "\uFFFD",
            codeFix: `<meta charSet="utf-8" />\n// Ensure database & API responses use UTF-8 NFC encoding`,
            viewport: "mobile",
          });
        }

        if (domData.unicodeHealth.nfdSequences > 0) {
          const sample = domData.nfdFindings[0];
          findings.push({
            id: nextId("bn"),
            ruleId: "bn-unicode-nfd",
            category: "Bengali Unicode",
            severity: "warning",
            confidence: "high",
            title: "Unnormalized Bengali Unicode sequences (NFD vs NFC)",
            message: `${domData.unicodeHealth.nfdSequences} Bengali text node(s) contain decomposed nukta or composite vowel sequences instead of canonical NFC.`,
            explanation:
              "Decomposed sequences (e.g., ড + ় or ে + া) can cause broken conjunct shaping and search indexing mismatches across browsers.",
            recommendation:
              "Normalize Bengali strings to Unicode Canonical Composition (NFC) before rendering or storing.",
            selector: sample?.selector ?? "body",
            evidence: sample?.evidence ?? "text !== text.normalize('NFC')",
            codeFix: `const cleanBengali = rawText.normalize("NFC");`,
          });
        }

        if (
          languageMode === "bn" &&
          domData.unicodeHealth.numeralStyle === "mixed" &&
          domData.numeralSample.bengaliCount > 0 &&
          domData.numeralSample.latinCount > 0
        ) {
          findings.push({
            id: nextId("bn"),
            ruleId: "bn-numeral-consistency",
            category: "Bengali Unicode",
            severity: "suggestion",
            confidence: "medium",
            title: "Mixed Bengali (০-৯) and Latin (0-9) numerals detected",
            message: `Detected ${domData.numeralSample.bengaliCount} Bengali digits alongside ${domData.numeralSample.latinCount} Latin digits inside Bengali text nodes.`,
            explanation:
              "In Bangla-primary interfaces, mixing Bengali and Latin digit systems within body copy can feel inconsistent unless Latin digits are intentionally used for technical codes.",
            recommendation:
              "Format user-facing counts, dates, and prices consistently using Intl.NumberFormat('bn-BD').",
            selector: domData.numeralSample.mixedSampleSelector ?? "body",
            evidence:
              domData.numeralSample.mixedSampleEvidence ??
              `Bengali digits: ${domData.numeralSample.bengaliCount}, Latin digits: ${domData.numeralSample.latinCount}`,
            codeFix: `new Intl.NumberFormat("bn-BD").format(value)`,
            requiresHumanReview: true,
          });
        }
      }

      // --- MODULE B: Localization ---
      const htmlLangLower = domData.detectedHtmlLang?.toLowerCase() ?? null;
      if (!htmlLangLower) {
        findings.push({
          id: nextId("l10n"),
          ruleId: "l10n-missing-html-lang",
          category: "Localization",
          severity: "critical",
          confidence: "high",
          title: "Missing root <html lang> declaration",
          message: `The root <html> element has no lang attribute (target mode: ${languageMode}).`,
          explanation:
            "Screen readers and browser translation tools rely on the root lang attribute to choose the right speech synthesizer and glyph shaping rules.",
          recommendation: `Add lang="${languageMode === "en" ? "en" : "bn"}" to the root <html> element.`,
          selector: "html",
          evidence: "<html> (lang attribute missing)",
          codeFix: `<html lang="${languageMode === "en" ? "en" : "bn"}">`,
        });
      } else if (
        (languageMode === "bn" || bengaliRatio >= 0.35) &&
        !htmlLangLower.startsWith("bn")
      ) {
        const pct = Math.round(bengaliRatio * 100);
        findings.push({
          id: nextId("l10n"),
          ruleId: "l10n-html-lang-mismatch",
          category: "Localization",
          severity: bengaliRatio >= 0.35 ? "critical" : "warning",
          confidence: "high",
          title: `HTML lang="${domData.detectedHtmlLang}" does not match Bengali target/content`,
          message:
            bengaliRatio > 0
              ? `${pct}% of visible alphabetic characters are Bengali script, yet <html lang="${domData.detectedHtmlLang}"> is declared.`
              : `Target audit mode is Bangla (bn), but the document declares <html lang="${domData.detectedHtmlLang}">.`,
          explanation:
            "When <html lang=\"en\"> is set on a Bengali or bilingual Bangla-first page, screen readers attempt to pronounce Bengali text with an English voice profile.",
          recommendation:
            languageMode === "bilingual"
              ? "Set <html lang=\"bn\"> (or the primary page language) and mark secondary language blocks with passage-level lang attributes."
              : "Set <html lang=\"bn\"> on the root document element.",
          selector: "html",
          evidence: `<html lang="${domData.detectedHtmlLang}">`,
          codeFix: `<html lang="bn">`,
        });
      }

      if (languageMode === "bn" && domData.bengaliCharCount === 0) {
        findings.push({
          id: nextId("l10n"),
          ruleId: "l10n-no-bengali-script",
          category: "Localization",
          severity: "warning",
          confidence: "high",
          title: "No Bengali script characters (U+0980–U+09FF) detected on page",
          message:
            "The scan was configured for Bangla ('bn') mode, but 0 Bengali Unicode characters were found in the rendered DOM.",
          explanation:
            "Either the page content is entirely in English/Latin script, or Bengali text is rendered inside images/canvas or legacy non-Unicode ANSI fonts.",
          recommendation:
            "Verify that localized Bengali copy is rendered as standard Unicode text in the DOM.",
          selector: "body",
          evidence: `Bengali chars: 0, Latin chars: ${domData.latinCharCount}`,
          requiresHumanReview: true,
        });
      }

      if (
        (languageMode === "bn" || (languageMode === "bilingual" && hasBengaliText)) &&
        domData.untranslatedPlaceholders.length > 0
      ) {
        const ph = domData.untranslatedPlaceholders[0];
        findings.push({
          id: nextId("l10n"),
          ruleId: "l10n-untranslated-placeholder",
          category: "Localization",
          severity: "warning",
          confidence: "medium",
          title: "Untranslated English form placeholder in Bangla/Bilingual mode",
          message: `${domData.untranslatedPlaceholders.length} form control(s) display English-only placeholder text (e.g. "${ph.placeholder}").`,
          explanation:
            "Leaving English placeholders inside Bengali or bilingual forms creates an inconsistent localization experience for Bangla readers.",
          recommendation: "Localize form input placeholders into clear Bengali instructions.",
          selector: ph.selector,
          evidence: ph.evidence,
          codeFix: `placeholder="এখানে তথ্য লিখুন..."`,
          viewport: "mobile",
          requiresHumanReview: true,
        });
      }

      for (const passage of domData.unmarkedPassages) {
        findings.push({
          id: nextId("l10n"),
          ruleId: "a11y-missing-passage-lang",
          category: "Accessibility",
          severity: "warning",
          confidence: "medium",
          title: `Secondary language passage lacks lang="${passage.expectedLang}" attribute`,
          message: `Found a multi-word ${
            passage.expectedLang === "en" ? "English" : "Bengali"
          } paragraph inside <html lang="${domData.detectedHtmlLang}"> without a passage-level lang attribute.`,
          explanation:
            "WCAG 3.1.2 (Language of Parts) requires passages in a secondary language to declare their own lang attribute so assistive technologies switch pronunciation engines.",
          recommendation: `Add lang="${passage.expectedLang}" to the container element wrapping this passage.`,
          selector: passage.selector,
          evidence: passage.evidence,
          codeFix: `<div lang="${passage.expectedLang}">...</div>`,
          requiresHumanReview: true,
        });
      }

      // --- MODULE C: Typography & Fonts ---
      if (enabled.has("fonts")) {
        if ((hasBengaliText || languageMode !== "en") && !domData.bengaliFontLoaded) {
          findings.push({
            id: nextId("font"),
            ruleId: "typo-missing-bengali-font",
            category: "Typography & Fonts",
            severity: "warning",
            confidence: "high",
            title: "No dedicated Bengali webfont detected in CSS font-family stack",
            message: `Computed font stack is "${domData.fontStackDetected.join(
              ", "
            )}". No known Bengali webfont was found.`,
            explanation:
              "Without an explicit Bengali webfont (such as Noto Sans Bengali, Hind Siliguri, or SolaimanLipi), browsers fall back to OS defaults whose conjunct shaping and matra heights vary widely across devices.",
            recommendation:
              "Load a Bengali webfont via next/font or Google Fonts and include it in your CSS font-family stack.",
            selector: "body",
            evidence: `font-family: ${domData.fontStackDetected.join(", ")};`,
            codeFix: `font-family: "Noto Sans Bengali", "Hind Siliguri", system-ui, sans-serif;`,
            viewport: "desktop",
          });
        }

        if (domData.tightLineHeightElements.length > 0) {
          const item = domData.tightLineHeightElements[0];
          findings.push({
            id: nextId("font"),
            ruleId: "typo-line-height-bn",
            category: "Typography & Fonts",
            severity: "suggestion",
            confidence: "medium",
            title: `Tight line-height (${item.ratio}) on Bengali text container`,
            message: `${domData.tightLineHeightElements.length} Bengali text element(s) have a line-height to font-size ratio below 1.32.`,
            explanation:
              "Bengali script uses ascending (ি, ী, ৈ, ৌ) and descending (ু, ূ, ৃ) vowel signs (matras/kars) that extend further vertically than Latin glyphs and clip when line-height is below ~1.4.",
            recommendation:
              "Set line-height to at least 1.45–1.6 on elements rendering Bengali script.",
            selector: item.selector,
            evidence: item.evidence,
            codeFix: `${item.selector} {\n  line-height: 1.5;\n}`,
          });
        }
      }

      // --- MODULE D: Responsive Layout (360px, 768px, 1440px) ---
      const viewportSnapshots: ViewportSnapshot[] = [];
      const overflowFindingIdByProfile = new Map<ViewportProfile, string>();
      const clippedFindingIdByProfile = new Map<ViewportProfile, string>();

      if (enabled.has("viewports")) {
        for (const vp of VIEWPORT_CONFIGS) {
          const sweep = viewportResults.get(vp.profile);
          if (!sweep) continue;

          if (sweep.overflowDetected) {
            const fId = nextId("resp");
            overflowFindingIdByProfile.set(vp.profile, fId);
            findings.push({
              id: fId,
              ruleId: `resp-horizontal-overflow-${vp.profile}`,
              category: "Responsive Layout",
              severity: "critical",
              confidence: "high",
              title: `Horizontal page overflow (+${sweep.overflowPx}px) at ${vp.widthPx}px ${vp.label} viewport`,
              message: `Document scrollWidth exceeds the ${vp.widthPx}px ${vp.label.toLowerCase()} viewport by ${sweep.overflowPx}px.`,
              explanation:
                "Unintended horizontal scrolling breaks mobile and responsive usability, often caused by fixed-width containers or non-wrapping flex rows.",
              recommendation:
                "Use max-width: 100%, responsive flex-wrap, or overflow-x: hidden on wide layout containers.",
              selector: sweep.overflowCulprit?.selector ?? "html > body",
              evidence:
                sweep.overflowCulprit?.evidence ??
                `documentElement.scrollWidth (${vp.widthPx + sweep.overflowPx}px) > viewport (${vp.widthPx}px)`,
              codeFix: `${sweep.overflowCulprit?.selector ?? "body"} {\n  max-width: 100%;\n  overflow-x: hidden;\n}`,
              viewport: vp.profile,
            });
          }

          if (sweep.clippedItems.length > 0) {
            const firstClip = sweep.clippedItems[0];
            const fId = nextId("resp");
            clippedFindingIdByProfile.set(vp.profile, fId);
            findings.push({
              id: fId,
              ruleId: `resp-text-clipping-${vp.profile}`,
              category: "Responsive Layout",
              severity: "warning",
              confidence: "high",
              title: `Clipped or truncated label at ${vp.widthPx}px (${vp.label})`,
              message: `${sweep.clippedItems.length} element(s) truncate content horizontally (e.g., "${firstClip.text}").`,
              explanation:
                "Bengali labels and CTAs are frequently 20–35% wider than equivalent English words and get cut off when containers enforce fixed widths with overflow: hidden.",
              recommendation:
                "Allow text wrapping (white-space: normal) or flexible min-width on buttons and navigation items.",
              selector: firstClip.selector,
              evidence: firstClip.evidence,
              codeFix: `${firstClip.selector} {\n  white-space: normal;\n  line-height: 1.5;\n}`,
              viewport: vp.profile,
            });
          }
        }
      }

      // --- MODULE E: axe-core Accessibility Violations ---
      if (enabled.has("axe")) {
        for (const v of axeViolations) {
          // Skip html-has-lang if we already emitted our dedicated l10n-missing-html-lang finding
          if (v.id === "html-has-lang" && findings.some((f) => f.ruleId === "l10n-missing-html-lang")) {
            continue;
          }

          const severity: FindingSeverity =
            v.impact === "critical" || v.impact === "serious"
              ? "critical"
              : v.impact === "moderate"
              ? "warning"
              : "suggestion";

          const firstNode = v.nodes[0];
          const selector =
            firstNode && Array.isArray(firstNode.target) && firstNode.target.length > 0
              ? String(firstNode.target[0])
              : "body";
          const evidenceHtml = firstNode?.html ?? "";

          findings.push({
            id: nextId("a11y"),
            ruleId: `axe-${v.id}`,
            category: "Accessibility",
            severity,
            confidence: "high",
            title: v.help,
            message: `${v.nodes.length} element(s) failed axe-core rule "${v.id}": ${v.description}`,
            explanation:
              firstNode?.failureSummary?.replace(/^Fix (any|all) of the following:\s*/i, "") ||
              v.description,
            recommendation: v.helpUrl
              ? `${v.help}. Reference: ${v.helpUrl}`
              : `${v.help}. Ensure WCAG 2.1 AA compliance for all affected elements.`,
            selector,
            evidence: evidenceHtml.slice(0, 260),
            codeFix: buildAxeCodeFix(v.id, selector),
          });
        }
      }

      // Build ViewportSnapshots (Mobile, Tablet, Desktop) with interactive bounding box highlights
      const orderedProfiles: ViewportProfile[] = ["mobile", "tablet", "desktop"];
      for (const profile of orderedProfiles) {
        const cfg = VIEWPORT_CONFIGS.find((c) => c.profile === profile)!;
        const sweep = viewportResults.get(profile) ?? {
          overflowDetected: false,
          overflowPx: 0,
          clippedElementsCount: 0,
          clippedItems: [],
        };

        const highlights: ViewportSnapshot["highlights"] = [];

        if (sweep.overflowDetected && overflowFindingIdByProfile.has(profile)) {
          const box = sweep.overflowCulprit?.box ?? {
            xPct: 64,
            yPct: 16,
            wPct: 32,
            hPct: 16,
          };
          highlights.push({
            id: `hl-${profile}-overflow`,
            label: `Horizontal Overflow (+${sweep.overflowPx}px)`,
            severity: "critical",
            ...box,
            findingId: overflowFindingIdByProfile.get(profile)!,
          });
        }

        if (sweep.clippedItems.length > 0 && clippedFindingIdByProfile.has(profile)) {
          const clip = sweep.clippedItems[0];
          highlights.push({
            id: `hl-${profile}-clip`,
            label: `Clipped UI Element`,
            severity: "warning",
            ...clip.box,
            findingId: clippedFindingIdByProfile.get(profile)!,
          });
        }

        // Also attach replacement char or placeholder highlights on mobile
        if (profile === "mobile") {
          const repFinding = findings.find((f) => f.ruleId === "bn-replacement-char");
          const repSample = domData.replacementFindings[0];
          if (repFinding && repSample?.box) {
            highlights.push({
              id: "hl-mobile-ufffd",
              label: "U+FFFD Glyph Corruption",
              severity: "critical",
              ...repSample.box,
              findingId: repFinding.id,
            });
          }

          const phFinding = findings.find((f) => f.ruleId === "l10n-untranslated-placeholder");
          const phSample = domData.untranslatedPlaceholders[0];
          if (phFinding && phSample?.box) {
            highlights.push({
              id: "hl-mobile-ph",
              label: "Untranslated Placeholder",
              severity: "warning",
              ...phSample.box,
              findingId: phFinding.id,
            });
          }
        }

        if (profile === "desktop") {
          const fontFinding = findings.find((f) => f.ruleId === "typo-missing-bengali-font");
          if (fontFinding) {
            highlights.push({
              id: "hl-desktop-font",
              label: "Missing Bengali Webfont",
              severity: "warning",
              xPct: 8,
              yPct: 24,
              wPct: 64,
              hPct: 18,
              findingId: fontFinding.id,
            });
          }
        }

        const status: ViewportSnapshot["status"] = sweep.overflowDetected
          ? "fail"
          : sweep.clippedElementsCount > 0 || highlights.length > 0
          ? "warn"
          : "pass";

        viewportSnapshots.push({
          profile,
          label: cfg.label,
          widthPx: cfg.widthPx,
          overflowDetected: sweep.overflowDetected,
          clippedElements: sweep.clippedElementsCount,
          status,
          highlights,
        });
      }

      // 5. Compute category scores & overall score
      const categories: AuditCategory[] = [
        "Bengali Unicode",
        "Accessibility",
        "Typography & Fonts",
        "Responsive Layout",
        "Localization",
      ];

      const categoryScores: CategoryScore[] = categories.map((category) => {
        const catFindings = findings.filter((f) => f.category === category);
        let penalty = 0;
        for (const f of catFindings) {
          if (f.severity === "critical") penalty += 22;
          else if (f.severity === "warning") penalty += 11;
          else penalty += 4;
        }
        const score = Math.max(15, Math.min(100, 100 - penalty));
        const baseChecks = category === "Accessibility" ? 12 : 6;
        return {
          category,
          score,
          passed: Math.max(1, baseChecks - catFindings.length),
          issues: catFindings.length,
        };
      });

      const overallScore = Math.round(
        categoryScores.reduce((acc, c) => acc + c.score, 0) / categoryScores.length
      );

      const scanDurationMs = Math.max(1, Date.now() - startedAt);

      return {
        id: `scan-${Date.now()}`,
        fixtureKey: "custom",
        url: targetUrl,
        siteTitle: domData.siteTitle,
        languageMode,
        detectedHtmlLang: domData.detectedHtmlLang,
        overallScore,
        scanDurationMs,
        scannedAt: new Date().toISOString(),
        fontStackDetected: domData.fontStackDetected,
        bengaliFontLoaded: domData.bengaliFontLoaded,
        unicodeHealth: domData.unicodeHealth,
        categoryScores,
        viewports: viewportSnapshots,
        findings,
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  },
};

function buildAxeCodeFix(ruleId: string, selector: string): string {
  switch (ruleId) {
    case "image-alt":
      return `<img src="..." alt="ছবির প্রাসঙ্গিক বাংলা বিবরণ" />`;
    case "label":
      return `<label htmlFor="field-id">বাংলা লেবেল</label>\n<input id="field-id" ... />`;
    case "button-name":
      return `<button type="button" aria-label="বোতামের কাজের বিবরণ">...</button>`;
    case "link-name":
      return `<a href="..." aria-label="লিংকের গন্তব্যের বিবরণ">বিস্তারিত</a>`;
    case "color-contrast":
      return `${selector} {\n  color: #0f172a; /* Ensure >= 4.5:1 WCAG AA contrast ratio */\n}`;
    case "html-has-lang":
    case "html-lang-valid":
      return `<html lang="bn">`;
    case "landmark-one-main":
    case "region":
      return `<main id="main-content">\n  <!-- Primary page content -->\n</main>`;
    default:
      return `/* Fix axe-core rule "${ruleId}" on selector: ${selector} */`;
  }
}
