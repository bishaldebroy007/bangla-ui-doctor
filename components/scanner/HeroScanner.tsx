"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Accessibility,
  ArrowRight,
  Check,
  Code2,
  Globe,
  Languages,
  Layers,
  MonitorSmartphone,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Type,
} from "lucide-react";
import { FIXTURE_PRESETS } from "@/lib/mock-audit";
import type { AuditReport, LanguageMode } from "@/types/audit";
import { ScanPipelineModal } from "./ScanPipelineModal";

const LANGUAGE_OPTIONS: { id: LanguageMode; label: string; sub: string }[] = [
  { id: "bn", label: "Bangla", sub: "বাংলা প্রধান" },
  { id: "en", label: "English", sub: "EN" },
  { id: "bilingual", label: "Bilingual", sub: "বাংলা + EN" },
];

type DiagnosticModuleId = "unicode" | "axe" | "fonts" | "viewports";

const DIAGNOSTIC_MODULES: { id: DiagnosticModuleId; label: string; active: boolean }[] = [
  { id: "unicode", label: "Unicode & NFC", active: true },
  { id: "axe", label: "axe-core A11y", active: true },
  { id: "fonts", label: "Bengali Font Stack", active: true },
  { id: "viewports", label: "360 / 768 / 1440px", active: true },
];

const PILLARS = [
  {
    icon: Type,
    title: "Bengali Typography & Unicode",
    bengali: "ইউনিকোড ও বাংলা টাইপোগ্রাফি",
    description:
      "Detects U+FFFD replacement glyphs, decomposed NFD conjuncts, configurable script mixing, and numeral consistency.",
    accent: "from-emerald-500/20 to-cyan-500/5 border-emerald-500/25 text-emerald-400",
  },
  {
    icon: Accessibility,
    title: "Accessibility (axe-core)",
    bengali: "অ্যাক্সেসিবিলিটি অডিট",
    description:
      "Audits alt text, form labels, WCAG contrast, ARIA attributes, and root/passage HTML lang declarations.",
    accent: "from-cyan-500/20 to-blue-500/5 border-cyan-500/25 text-cyan-400",
  },
  {
    icon: Layers,
    title: "Font Stack & Rendering",
    bengali: "ফন্ট লোডিং ও রেন্ডারিং",
    description:
      "Verifies webfont loading, Bengali-capable fallback stacks, and prevents clipped matras or tight line-heights.",
    accent: "from-violet-500/20 to-fuchsia-500/5 border-violet-500/25 text-violet-400",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive Layout Sweep",
    bengali: "রেসপনসিভ লেআউট চেক",
    description:
      "Simulates 360px Mobile, 768px Tablet, and 1440px Desktop to catch horizontal overflow and clipped Bengali CTAs.",
    accent: "from-amber-500/20 to-orange-500/5 border-amber-500/25 text-amber-400",
  },
  {
    icon: Languages,
    title: "Localization Consistency",
    bengali: "লোকালাইজেশন সামঞ্জস্য",
    description:
      "Flags untranslated placeholders, date/currency mismatches, and distinguishes heuristic guesses from hard defects.",
    accent: "from-rose-500/20 to-pink-500/5 border-rose-500/25 text-rose-400",
  },
  {
    icon: ShieldAlert,
    title: "SSRF-Safe Worker Architecture",
    bengali: "নিরাপদ স্ক্যানার ইঞ্জিন",
    description:
      "Isolated Playwright execution with strict HTTP/HTTPS validation, public DNS checks, and bounded timeouts.",
    accent: "from-teal-500/20 to-emerald-500/5 border-teal-500/25 text-teal-400",
  },
];

export function HeroScanner() {
  const router = useRouter();
  const [url, setUrl] = useState("https://www.prothomalo.com");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("bn");
  const [selectedFixture, setSelectedFixture] = useState<
    "healthy" | "problematic" | "bilingual" | "custom"
  >("custom");
  const [enabledModules, setEnabledModules] = useState<DiagnosticModuleId[]>(
    DIAGNOSTIC_MODULES.map((m) => m.id)
  );
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanFinished, setIsScanFinished] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const completedScanIdRef = useRef<string | null>(null);

  const handleSelectFixture = (preset: (typeof FIXTURE_PRESETS)[number]) => {
    setUrl(preset.url);
    setLanguageMode(preset.languageMode);
    setSelectedFixture(preset.key);
    setUrlError(null);
  };

  const toggleModule = (id: DiagnosticModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setUrlError("Please enter a valid http:// or https:// URL.");
      return;
    }
    setUrlError(null);
    setScanError(null);
    setIsScanFinished(false);
    completedScanIdRef.current = null;
    setIsScanning(true);

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          languageMode,
          enabledModules,
          fixtureKey: selectedFixture,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            scan?: { id: string };
            report?: AuditReport;
            error?: string;
          }
        | null;

      if (!res.ok || !data?.scan?.id) {
        throw new Error(data?.error || `Scan request failed with status ${res.status}`);
      }

      completedScanIdRef.current = data.scan.id;
      if (data.report && typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            `bangla-ui-doctor:scan:${data.scan.id}`,
            JSON.stringify(data.report)
          );
        } catch {
          // Ignore storage quota issues
        }
      }
      setIsScanFinished(true);
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : "Failed to run Playwright diagnostic scan."
      );
    }
  };

  const handleScanComplete = useCallback(() => {
    setIsScanning(false);
    setIsScanFinished(false);
    const scanId = completedScanIdRef.current;
    if (scanId) {
      router.push(`/scan?id=${encodeURIComponent(scanId)}`);
      return;
    }
    const params = new URLSearchParams({
      fixture: selectedFixture,
      url: url.trim(),
      lang: languageMode,
    });
    router.push(`/scan?${params.toString()}`);
  }, [languageMode, router, selectedFixture, url]);

  const handleDismissError = useCallback(() => {
    setIsScanning(false);
    setIsScanFinished(false);
    setScanError(null);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient Futuristic Background */}
      <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-70" />
      <div className="pointer-events-none absolute -top-36 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-40 right-0 h-[340px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />

      {/* Floating Bengali Glyph Watermarks */}
      <motion.div
        animate={{ y: [0, -14, 0], opacity: [0.06, 0.12, 0.06] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        className="pointer-events-none absolute top-24 left-[8%] hidden select-none font-bengali text-8xl font-bold text-emerald-400 lg:block"
      >
        অ
      </motion.div>
      <motion.div
        animate={{ y: [0, 16, 0], opacity: [0.05, 0.11, 0.05] }}
        transition={{ repeat: Infinity, duration: 8.5, ease: "easeInOut" }}
        className="pointer-events-none absolute top-44 right-[9%] hidden select-none font-bengali text-8xl font-bold text-cyan-400 lg:block"
      >
        বাংলা
      </motion.div>

      <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 lg:px-8 lg:pt-20">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>BENGALI WEB DIAGNOSTICS &amp; LOCALIZATION LAB</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Precision UI Doctor for{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Bangla &amp; Bilingual
            </span>{" "}
            Websites
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
            Scan any public URL for broken Bengali Unicode, missing{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-emerald-300">
              lang=&quot;bn&quot;
            </code>{" "}
            metadata, webfont fallbacks,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
              axe-core
            </code>{" "}
            accessibility barriers, and 360px mobile overflow.
          </p>
        </motion.div>

        {/* Futuristic Command Console */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-4xl"
        >
          <form
            onSubmit={handleStartScan}
            className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0a101d]/85 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-7"
          >
            {/* Subtle top luminous border */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

            {/* URL Input Row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setSelectedFixture("custom");
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="https://example-bangla-site.com"
                  aria-label="Website URL to audit"
                  className="h-13 w-full rounded-2xl border border-white/15 bg-black/45 pr-4 pl-11 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/25 focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isScanning}
                className="group relative inline-flex h-13 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] disabled:opacity-60"
              >
                <ScanSearch className="size-4.5 transition-transform duration-300 group-hover:rotate-12" />
                <span>Run Diagnostic</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </motion.button>
            </div>

            {urlError && (
              <p className="mt-2 font-mono text-xs text-rose-400">{urlError}</p>
            )}

            {/* Configuration Controls Row */}
            <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center">
              {/* Language Mode Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Target Locale:
                </span>
                <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const active = languageMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLanguageMode(opt.id)}
                        className={`relative cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          active ? "text-emerald-200" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="lang-mode-pill"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-lg border border-emerald-500/40 bg-emerald-500/15"
                          />
                        )}
                        <span className="relative z-10">{opt.label}</span>
                        <span className="relative z-10 ml-1.5 hidden font-bengali text-[10px] opacity-75 sm:inline">
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostic Module Toggles */}
              <div className="flex flex-wrap items-center gap-1.5">
                {DIAGNOSTIC_MODULES.map((mod) => {
                  const enabled = enabledModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all ${
                        enabled
                          ? "border-cyan-500/35 bg-cyan-500/10 text-cyan-200"
                          : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Check
                        className={`size-3 ${
                          enabled ? "text-cyan-400" : "opacity-30"
                        }`}
                      />
                      {mod.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controlled Fixture Presets */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Controlled Test Fixtures &amp; Live URL Presets
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Live Playwright + axe-core + Neon Storage
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {FIXTURE_PRESETS.map((preset) => {
                  const isSelected = selectedFixture === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleSelectFixture(preset)}
                      className={`group flex cursor-pointer flex-col items-start rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {preset.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            preset.key === "healthy"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : preset.key === "problematic"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </motion.div>

        {/* 6-Card Diagnostic Pillars Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-20"
        >
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                Modular Rule Architecture
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl">
                Built for Real Bengali Web Engineering
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs text-slate-400">
              <Code2 className="size-4 text-cyan-400" />
              <span>Independent Rules • Evidence-First • Zero Fluff</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b111e]/75 p-5 backdrop-blur-xl transition-colors hover:border-white/20"
                >
                  <div
                    className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl border bg-gradient-to-br ${pillar.accent}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {pillar.title}
                  </h3>
                  <p className="mt-0.5 font-bengali text-xs text-emerald-400/80">
                    {pillar.bengali}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <ScanPipelineModal
        isOpen={isScanning}
        targetUrl={url}
        languageMode={languageMode}
        isScanFinished={isScanFinished}
        scanError={scanError}
        onComplete={handleScanComplete}
        onDismissError={handleDismissError}
      />
    </div>
  );
}
