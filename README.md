# Bangla UI Doctor

**A Bengali-focused website quality, accessibility, typography, and localization auditor.**

Bangla UI Doctor scans publicly accessible websites and helps developers, QA engineers, and teams catch Bengali-specific usability, accessibility, rendering, and localization issues alongside standard web accessibility checks.

---

## Problems It Solves

Generic accessibility and UI checkers rarely catch issues unique to Bengali and bilingual web interfaces. Bangla UI Doctor is designed to surface:

- **Bengali Typography & Unicode Issues**: Unicode replacement characters (`U+FFFD` / ``), inconsistent Unicode normalization (e.g. NFD vs. NFC), unexpected mixing of Bengali and Latin scripts, numeral style inconsistencies (Bengali vs. Latin digits), and tight line-heights that clip Bengali vowel signs (`ু`, `ূ`, `ৃ`).
- **Font Loading & Rendering Failures**: Missing Bengali-capable font declarations in CSS font stacks and web font loading failures.
- **Responsive Layout & Overflow**: Horizontal page overflow, clipped navigation labels, overlapping elements, and text overflowing containers across Mobile (`360px`), Tablet (`768px`), and Desktop (`1440px`) viewports.
- **Accessibility Gaps**: Missing `alt` text, unlabeled form controls, insufficient color contrast, invalid ARIA attributes, heading hierarchy issues, and missing document/passage `lang` attributes (powered by `axe-core` integration in the audit pipeline).
- **Localization Inconsistencies**: Missing or mismatched HTML `lang` declarations, untranslated placeholders in bilingual UIs, and inconsistent formatting.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (`@base-ui/react`)
- **Backend / API**: Next.js Route Handlers (`app/api/`)
- **Database**: Neon Postgres (`pg` pooled runtime client + unpooled migration runner)
- **Object Storage**: Neon Object Storage (S3-compatible via `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`)
- **Validation**: Zod (including SSRF host/protocol filtering on scan URLs)
- **Browser & Accessibility Tooling**: Playwright, `axe-core`

---

## Project Structure

```text
├── app/
│   ├── page.tsx                  # Landing page & scanner entry
│   ├── scan/page.tsx             # Interactive audit report workspace
│   └── api/
│       ├── health/route.ts       # Postgres + Object Storage health check
│       └── scans/
│           ├── route.ts          # List & create scans
│           └── [id]/route.ts     # Fetch scan metadata, report JSON & presigned URL
├── components/                   # UI, report, scanner, and finding inspector components
├── db/migrations/                # SQL migrations (001_init.sql)
├── lib/
│   ├── db/pool.ts                # Pooled Postgres client
│   ├── storage/client.ts         # Neon Object Storage (S3) client
│   ├── server/env.ts             # Validated server environment loader
│   ├── modules/scans/            # Modular scan domain (schema, repository, engine, service)
│   └── mock-audit.ts             # Diagnostic fixtures & mock scan engine
├── scripts/migrate.ts            # Direct-connection SQL migration runner
├── types/audit.ts                # Core TypeScript audit contracts
├── neon.ts                       # Neon branches & object storage configuration
└── doc/bangla-ui-doctor-initial-plan.md
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (`bun@1.4.4` or compatible)
- A [Neon](https://neon.com/) account/project (with Postgres and Object Storage enabled)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure Neon & environment variables

If you are setting up Neon for the project, install the Neon CLI and deploy the configuration defined in `neon.ts`:

```bash
bun i -g neon@latest
neon login
neon deploy
```

`neon deploy` provisions the services declared in `neon.ts` and pulls the required environment variables into `.env` (see `.env.example` for the expected keys):

- `DATABASE_URL` (pooled connection for runtime queries)
- `DATABASE_URL_UNPOOLED` (direct connection for migrations)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` (Neon Object Storage)
- `STORAGE_BUCKET` (defaults to `assets`)

### 3. Run database migrations

```bash
bun run db:migrate
```

### 4. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build & run in production

```bash
bun run build
bun run start
```

### 6. Verify backend services

Once the server is running, you can verify Postgres and Object Storage connectivity via:

```bash
curl http://localhost:3000/api/health
```

Expected response: `{"postgres":"ok","storage":"ok"}` (`200 OK`).

---

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Verifies Neon Postgres and Object Storage connectivity |
| `GET` | `/api/scans` | Lists recent scan records from Postgres |
| `POST` | `/api/scans` | Validates URL (with SSRF protection), runs scan, stores report JSON in Object Storage |
| `GET` | `/api/scans/[id]` | Returns scan metadata, stored report JSON, and a presigned download URL |

---

## Contributing

Contributions are welcome! Please read `doc/bangla-ui-doctor-initial-plan.md` to understand the architecture, rule engine design, and security requirements (especially SSRF protections for URL scanning).

### How to contribute

1. Fork the repository and create a feature branch from `main`.
2. Keep changes modular (for example, new audit rules or scan engines under `lib/modules/`).
3. Ensure linting and production builds pass before opening a pull request:
   ```bash
   bun run lint
   bun run build
   ```
4. Submit a pull request with a clear description of the problem solved and how you tested it.

### License & Contribution Terms

This project is licensed under the **Apache License, Version 2.0** — see [LICENSE.md](./LICENSE.md) for the full text.

By contributing to Bangla UI Doctor, you agree to the terms of the Apache License 2.0, including:

- **Submission of Contributions (Section 5)**: Any contribution intentionally submitted for inclusion in the project is provided under the terms and conditions of the Apache License 2.0, without any additional terms or conditions (unless covered by a separate written agreement).
- **Redistribution & Attribution (Section 4)**: If you redistribute the work or derivative works, you must include a copy of the license, retain existing copyright/patent/attribution notices, and clearly mark any modified files stating that you changed them.
