"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Cpu,
  Heart,
  Mail,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const CURRENT_YEAR = 2025;

export function Footer() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-[#05080f] text-slate-400">
      {/* Top subtle glow divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Creator Bio (Span 2 columns on lg) */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-transform duration-300 group-hover:scale-105">
                <Activity className="size-4.5 text-emerald-400" />
                <span className="absolute -top-1 -right-1 flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-100">
                    Bangla UI Doctor
                  </span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-cyan-300">
                    v0.1 LAB
                  </span>
                </div>
                <span className="font-bengali text-xs text-slate-400">
                  বাংলা ওয়েব কোয়ালিটি ও অ্যাক্সেসিবিলিটি অডিটর
                </span>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Developer-focused diagnostic engine engineered to identify Bengali-specific
              typography breakdowns, Unicode normalization anomalies (NFD/NFC),
              WCAG accessibility violations, and multi-viewport responsive overflows.
            </p>

            {/* Creator Attribution Spotlight Card */}
            <div className="relative mt-6 overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-[#0b111e] to-cyan-500/5 p-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-inner">
                  <Heart className="size-4.5 fill-emerald-400/20 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Created & Engineered by</span>
                    <a
                      href="https://github.com/bishaldebroy007"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline"
                    >
                      Bishal Deb Roy
                      <ArrowUpRight className="size-3 text-emerald-400" />
                    </a>
                  </div>
                  <p className="font-bengali text-xs text-emerald-400/90">
                    বিশাল দেব রায় কর্তৃক পরিকল্পিত ও নির্মিত
                  </p>
                  <p className="text-[11px] leading-snug text-slate-400">
                    Dedicated to advancing Bengali typography standards and accessibility on the modern web.
                  </p>
                  <div className="flex items-center gap-3 pt-2 text-xs">
                    <a
                      href="https://github.com/bishaldebroy007"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-emerald-300"
                    >
                      <svg
                        className="size-3.5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <span>GitHub</span>
                    </a>
                    <span className="text-slate-600">•</span>
                    <a
                      href="mailto:bishaldebroy2000@gmail.com"
                      className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-emerald-300"
                    >
                      <Mail className="size-3.5" />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostics Column */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
              <Terminal className="size-3.5 text-emerald-400" />
              Diagnostics
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-emerald-300"
                >
                  Scanner Terminal
                </Link>
              </li>
              <li>
                <Link
                  href="/scan?fixture=problematic"
                  className="transition-colors hover:text-emerald-300"
                >
                  Audit Report Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/scan?fixture=unicode_broken"
                  className="transition-colors hover:text-emerald-300"
                >
                  Unicode & Glyphs Auditor
                </Link>
              </li>
              <li>
                <Link
                  href="/scan?fixture=clean"
                  className="transition-colors hover:text-emerald-300"
                >
                  Benchmark Report (Clean)
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span>3-Viewport Simulator</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.2 font-mono text-[9px] text-slate-400">
                    360/768/1440
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Standards & Specs Column */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
              <ShieldCheck className="size-3.5 text-cyan-400" />
              Standards
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://unicode.org/charts/PDF/U0980.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-cyan-300"
                >
                  <span>Unicode Bengali (U+0980)</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.w3.org/TR/WCAG22/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-cyan-300"
                >
                  <span>W3C WCAG 2.2 Guidelines</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.w3.org/International/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-cyan-300"
                >
                  <span>W3C i18n Layout Specs</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://dequeuniversity.com/rules/axe/4.10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-cyan-300"
                >
                  <span>axe-core Rule Engine</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://fonts.google.com/?subset=bengali"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-cyan-300"
                >
                  <span>Google Bengali Fonts</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Engine & Telemetry Status Column */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
              <Cpu className="size-3.5 text-emerald-400" />
              Engine Status
            </h4>
            <div className="space-y-2.5 rounded-xl border border-white/10 bg-[#0b111e]/80 p-3.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Playwright Worker</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">axe-core Engine</span>
                <span className="text-slate-200">v4.14.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database</span>
                <span className="text-cyan-300">Neon Postgres</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Object Storage</span>
                <span className="text-slate-200">S3 Presigned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-xs text-slate-400">
              © {CURRENT_YEAR} Bangla UI Doctor. Built & designed by{" "}
              <a
                href="https://github.com/bishaldebroy007"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-200 transition-colors hover:text-emerald-300 hover:underline"
              >
                Bishal Deb Roy
              </a>
              .
            </p>
            <p className="font-bengali text-[11px] text-slate-400">
              বাংলা ওয়েব অডিট ও টাইপোগ্রাফি প্ল্যাটফর্ম — সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
              Made by Bishal Deb Roy
            </span>
            <a
              href="https://github.com/bishaldebroy007"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-slate-200"
            >
              GitHub
            </a>
            <span>•</span>
            <Link href="/" className="transition-colors hover:text-slate-200">
              Home
            </Link>
            <span>•</span>
            <Link
              href="/scan?fixture=problematic"
              className="transition-colors hover:text-slate-200"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
