# Bangla UI Doctor --- Initial Project Plan

> **A Bengali-focused website quality, accessibility, typography, and
> localization auditor.**

## 1. Product overview

Bangla UI Doctor is a developer-focused tool that scans a public website
and identifies potential Bengali-specific usability, accessibility,
typography, rendering, and localization problems.

A user enters a URL, selects the expected language configuration
(Bangla, English, or bilingual), runs an audit, and receives a report
containing detected issues, evidence, severity, and suggested fixes.

### Target users

-   Frontend developers building Bengali-language websites
-   QA engineers and accessibility testers
-   Web agencies working with Bangladeshi clients
-   Teams maintaining bilingual websites
-   Organizations operating Bengali-language public services

### Core value proposition

Unlike a generic accessibility checker, Bangla UI Doctor adds
Bengali-language and localization-focused checks to established browser
and accessibility testing tools.

------------------------------------------------------------------------

## 2. User workflow

1.  Open Bangla UI Doctor.
2.  Enter a publicly accessible website URL.
3.  Select the expected language configuration:
    -   Bangla
    -   English
    -   Bilingual
4.  Start the audit.
5.  The browser worker loads the page and runs the selected checks.
6.  The user reviews findings grouped by category and severity.
7.  The user can inspect evidence and recommendations.
8.  The user downloads or shares the audit report.

------------------------------------------------------------------------

## 3. MVP scope

The first version should focus on a single-page audit. Avoid multi-page
crawling, accounts, scheduled scans, and AI-generated recommendations
until the core detection engine is reliable.

  Feature                                   MVP priority
  ----------------------------------------- --------------
  Scan a public URL                         Required
  Accessibility checks                      Required
  Bengali Unicode checks                    Required
  HTML language declaration checks          Required
  Responsive overflow checks                Required
  Evidence and affected element details     Required
  Severity and recommendation per finding   Required
  Downloadable report                       Required
  Multi-page crawling                       Later
  User accounts and saved history           Later
  Scheduled monitoring                      Later
  AI-powered recommendations                Later
  Automatic code fixes                      Later

### Initial audit categories

#### A. Bengali typography and Unicode

-   Detect Unicode replacement characters (`�`).
-   Identify text that may have inconsistent Unicode normalization.
-   Detect unexpected mixing of Bengali and Latin scripts where
    configurable rules apply.
-   Check Bengali and English numeral consistency according to the
    user's selected convention.
-   Inspect declared font families and font-loading failures.
-   Identify possible text clipping or overflow.

**Important:** Do not automatically treat every mixed-script phrase or
English numeral as an error. Rules should be configurable, and findings
should explain why they were raised.

Unicode normalization should be treated carefully. NFC can be a useful
normalization target, but the scanner should report potential
inconsistencies rather than modify the source website.

#### B. Accessibility

Integrate `axe-core` rather than implementing a complete accessibility
engine from scratch.

Check for issues such as:

-   Images without alternative text
-   Buttons without accessible names
-   Form controls without labels
-   Insufficient color contrast
-   Invalid ARIA attributes
-   Missing or problematic heading structure
-   Missing document language declaration
-   Missing language metadata on passages that use another language

Automated checks cannot identify every accessibility issue. The report
must distinguish machine-detectable findings from issues requiring human
review.

#### C. Font and rendering checks

-   Check whether declared web fonts load successfully.
-   Inspect whether the font stack explicitly includes a suitable
    Bengali-capable font.
-   Detect possible text clipping and container overflow.
-   Record rendering evidence at selected viewport sizes.

A missing Bengali-specific font declaration is a warning, not proof that
Bengali glyphs are broken. Browser fallback fonts may render the text
correctly.

#### D. Responsive layout checks

Run the page at a small set of viewport sizes:

  Profile         Viewport
  --------- --------------
  Mobile       360 px wide
  Tablet       768 px wide
  Desktop     1440 px wide

Check for:

-   Horizontal page overflow
-   Text extending beyond containers
-   Clipped navigation labels
-   Buttons with insufficient space
-   Overlapping elements
-   Form labels that become difficult to read

These checks should report potential layout problems with screenshots or
element-level evidence where possible.

#### E. Localization consistency

Potential checks include:

-   Missing or incorrect language metadata
-   Untranslated placeholders in configured bilingual areas
-   Inconsistent date and currency formatting
-   Inconsistent terminology for repeated interface labels
-   Unexpected language mixing

Some localization checks require project-specific configuration or human
review. Avoid presenting heuristic guesses as confirmed defects.

------------------------------------------------------------------------

## 4. Recommended technology stack

Keep the MVP TypeScript-based. A separate Python service is not
necessary for the initial feature set.

  Layer                  Technology
  ---------------------- -----------------------------------------------------
  Frontend               Next.js + TypeScript
  UI components          Tailwind CSS + shadcn/ui
  Browser automation     Playwright
  Accessibility engine   axe-core
  Unicode analysis       Native JavaScript Unicode APIs
  Backend/API            Next.js Route Handlers
  Database               PostgreSQL
  ORM                    Prisma or Drizzle
  Charts                 Recharts (optional)
  Background execution   Separate browser worker
  Hosting                Next.js hosting plus an isolated worker environment

### Architecture

``` text
User
  |
  v
Next.js Frontend
  |  URL submission, configuration, report UI
  v
Next.js API / Scan Job Manager
  |  Input validation, job creation, report retrieval
  v
Isolated Browser Audit Worker
  |
  +--> Playwright
  |      Page loading, DOM inspection, screenshots
  |
  +--> axe-core
  |      Accessibility checks
  |
  +--> Bengali Analyzer
  |      Unicode, script, numeral, text checks
  |
  +--> Layout Analyzer
         Viewport, overflow, clipping checks
  |
  v
Rule Engine
  |  Normalize findings, assign severity,
  |  attach evidence and recommendations
  v
PostgreSQL
     Scan metadata, findings, configurations
```

For a local prototype, the worker can initially run as a simple process.
Add a durable queue such as BullMQ and Redis only when asynchronous job
management becomes necessary.

------------------------------------------------------------------------

## 5. Rule engine design

Implement checks as independent rules instead of placing all logic in
one large scanning function.

### Suggested structure

``` text
src/
├── app/
│   ├── page.tsx
│   ├── scan/
│   └── api/
│       └── scans/
├── components/
│   ├── audit-form/
│   ├── report/
│   └── findings/
├── lib/
│   ├── scanner/
│   │   ├── browser.ts
│   │   ├── context.ts
│   │   └── runner.ts
│   ├── rules/
│   │   ├── accessibility/
│   │   │   ├── missing-alt.ts
│   │   │   ├── missing-labels.ts
│   │   │   └── contrast.ts
│   │   ├── bengali/
│   │   │   ├── unicode-normalization.ts
│   │   │   ├── mixed-script.ts
│   │   │   ├── numeral-consistency.ts
│   │   │   └── invalid-characters.ts
│   │   ├── typography/
│   │   │   ├── font-loading.ts
│   │   │   └── text-overflow.ts
│   │   ├── responsive/
│   │   │   ├── horizontal-overflow.ts
│   │   │   └── text-clipping.ts
│   │   └── localization/
│   │       ├── language-declaration.ts
│   │       └── placeholder-detection.ts
│   └── reports/
├── types/
│   └── audit.ts
└── tests/
```

### Initial TypeScript contracts

``` ts
export type FindingSeverity =
  | "critical"
  | "warning"
  | "suggestion";

export type FindingConfidence =
  | "high"
  | "medium"
  | "low";

export interface AuditFinding {
  ruleId: string;
  category: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  message: string;
  explanation: string;
  recommendation: string;
  selector?: string;
  evidence?: string;
}

export interface AuditContext {
  url: string;
  languageMode: "bn" | "en" | "bilingual";
  // Add browser page, extracted DOM data,
  // viewport information, and user rule settings.
}

export interface AuditRule {
  id: string;
  title: string;
  category: string;
  check(context: AuditContext): Promise<AuditFinding[]>;
}
```

Each rule should return structured findings. The report layer should not
need to know how a particular rule works.

### Severity guidance

-   **Critical:** A high-confidence issue that seriously blocks access
    or functionality.
-   **Warning:** A likely usability, accessibility, or localization
    problem.
-   **Suggestion:** A quality improvement or a low-confidence heuristic
    worth reviewing.

Severity should be assigned based on impact and confidence, not merely
on the category of the rule.

------------------------------------------------------------------------

## 6. Security and reliability requirements

Because users can submit arbitrary URLs, the scanner is a potential SSRF
entry point. This is a core engineering requirement, not an optional
enhancement.

At minimum:

-   Accept only HTTP and HTTPS URLs.
-   Reject localhost, loopback, private, link-local, and reserved IP
    ranges.
-   Validate DNS resolution and revalidate every redirect destination.
-   Protect against DNS rebinding.
-   Restrict the browser worker's network access.
-   Block access to cloud metadata endpoints and internal services.
-   Apply request, navigation, and total scan timeouts.
-   Limit response sizes, page resources, and scan duration.
-   Do not expose worker credentials or internal network details to
    scanned pages.
-   Avoid storing page content or screenshots longer than necessary.
-   Rate-limit scan submissions.

Use an isolated worker/container with restrictive network egress. URL
validation in the frontend alone is not sufficient.

------------------------------------------------------------------------

## 7. Fourteen-day implementation roadmap

  -----------------------------------------------------------------------
  Days                    Work                    Expected result
  ----------------------- ----------------------- -----------------------
  1--2                    Project foundation      Next.js setup, database
                                                  schema, dashboard
                                                  shell, scan
                                                  configuration

  3--4                    Browser scanning        Playwright worker, URL
                                                  validation, page
                                                  loading, DOM
                                                  extraction, screenshots

  5--6                    Accessibility analyzer  axe-core integration,
                                                  language, image, and
                                                  form checks

  7--8                    Bengali analyzer        Unicode, script,
                                                  numeral, and
                                                  suspicious-character
                                                  checks

  9--10                   Responsive analyzer     Mobile, tablet, and
                                                  desktop overflow checks

  11--12                  Reports and UI          Findings, filters,
                                                  evidence,
                                                  recommendations, report
                                                  export

  13--14                  Testing and deployment  Test sites, regression
                                                  tests, documentation,
                                                  deployment
  -----------------------------------------------------------------------

This is a focused estimate for a prototype, not a guarantee that every
heuristic will be production-grade within two weeks. Prioritize
correctness and security over the number of checks.

------------------------------------------------------------------------

## 8. Test strategy

Build controlled test pages with known issues. Do not rely only on
scanning random public websites.

Create three fixtures:

### Fixture A: Healthy Bengali website

-   Correct `lang` metadata
-   Appropriate Bengali font stack
-   Consistent configured numeral convention
-   Accessible forms and images
-   No horizontal overflow at target viewports

Expected result: no high-severity findings from the implemented rules.

### Fixture B: Intentionally problematic Bengali website

Introduce known examples of:

-   Missing language metadata
-   Missing image alternative text
-   Unlabelled form controls
-   Unicode replacement characters
-   Configured numeral inconsistencies
-   Text clipping and horizontal overflow

Expected result: the scanner detects the seeded issues with evidence.

### Fixture C: Bilingual website

Include:

-   Bengali and English passages
-   Passage-level language metadata
-   Configured terminology and formatting variations
-   A mixture of Bengali and English numerals

Expected result: the scanner respects the configured bilingual rules and
avoids treating valid language mixing as an error.

### Metrics to track

-   Detection precision: how many reported findings are valid?
-   Detection recall: how many seeded issues are detected?
-   False-positive rate
-   Scan completion rate
-   Average scan duration
-   Reproducibility across repeated scans

For each rule, document known limitations and examples that should not
trigger a finding.

------------------------------------------------------------------------

## 9. Portfolio presentation

The project should be presented as a working developer tool, not merely
a dashboard screenshot.

Include:

1.  **Live demo:** A working URL scanner with controlled demo websites.
2.  **GitHub repository:** Clean architecture, useful commits, setup
    instructions, and tests.
3.  **README:** Problem statement, features, architecture, limitations,
    and screenshots.
4.  **Technical case study:** Explain the rule engine, browser worker,
    security decisions, and trade-offs.
5.  **Evaluation report:** Show seeded issues, true detections, false
    positives, and missed cases.
6.  **Before-and-after evidence:** Show how developers can fix the
    detected problems.

A small benchmark dataset of Bengali UI examples with expected findings
would be a valuable differentiator.

------------------------------------------------------------------------

## 10. Cost and deployment strategy

The MVP does not require a paid LLM API, GPU, or commercial
accessibility API.

Keep costs low by:

-   Using open-source Playwright and axe-core.
-   Running Unicode and localization checks locally in the worker.
-   Using a small PostgreSQL database.
-   Limiting scans to one page and a few viewport sizes.
-   Applying strict time and resource limits.
-   Using synthetic test websites for demonstrations.

The browser worker is likely to be the most resource-intensive
component. Do not run unbounded browser scans on a small web application
server.

------------------------------------------------------------------------

## 11. Explicitly out of scope for the first release

Do not build these before the core scanner is dependable:

-   Full-site crawling
-   User accounts and subscription plans
-   Scheduled recurring scans
-   Team collaboration
-   AI-generated recommendations
-   Automatic source-code fixes
-   Browser extensions
-   Complex historical analytics

These features can be considered after the MVP has been tested with real
developers.

------------------------------------------------------------------------

## 12. Definition of done

The MVP is ready to showcase when:

-   A user can submit a valid public URL.
-   The scanner safely loads the page in an isolated worker.
-   The configured audit rules execute and return structured findings.
-   Findings include category, severity, explanation, recommendation,
    and evidence where applicable.
-   The tool tests the agreed viewport sizes.
-   The report is understandable and exportable.
-   The three controlled fixtures produce expected results.
-   Automated tests cover the main rules and critical security
    validations.
-   The README explains setup, architecture, limitations, and
    deployment.
-   A live demonstration is available.

## Product principle

**Build a reliable detection engine first, a polished dashboard
second.**

The project's strongest differentiator is not the number of checks or
the visual design. It is the quality of its Bengali-specific detection
rules, the evidence supporting each finding, and its ability to avoid
misleading developers with false positives.
