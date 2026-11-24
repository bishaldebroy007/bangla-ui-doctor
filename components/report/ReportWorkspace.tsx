"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Download,
  FileJson,
  Globe,
  Info,
  Search,
  Sparkles,
  Timer,
} from "lucide-react";
import { FIXTURE_PRESETS, getAuditReport } from "@/lib/mock-audit";
import type { AuditCategory, AuditFinding, FindingSeverity } from "@/types/audit";
import { ScoreRing } from "./ScoreRing";
import { ViewportSimulator } from "./ViewportSimulator";
import { FindingInspectorDrawer } from "../findings/FindingInspectorDrawer";

const SEVERITY_FILTERS: ("all" | FindingSeverity)[] = [
  "all",
  "critical",
  "warning",
  "suggestion",
];

const CATEGORY_FILTERS: ("all" | AuditCategory)[] = [
  "all",
  "Bengali Unicode",
  "Accessibility",
  "Typography & Fonts",
  "Responsive Layout",
  "Localization",
];

export function ReportWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fixture = searchParams.get("fixture");
  const urlParam = searchParams.get("url");
  const langParam = searchParams.get("lang");

  const report = useMemo(
    () => getAuditReport(fixture, urlParam, langParam),
    [fixture, urlParam, langParam]
  );

  const [severityFilter, setSeverityFilter] = useState<"all" | FindingSeverity>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AuditCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);

  const counts = useMemo(() => {
    return {
      critical: report.findings.filter((f) => f.severity === "critical").length,
      warning: report.findings.filter((f) => f.severity === "warning").length,
      suggestion: report.findings.filter((f) => f.severity === "suggestion").length,
    };
  }, [report.findings]);

  const filteredFindings = useMemo(() => {
    return report.findings.filter((item) => {
      if (severityFilter !== "all" && item.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.ruleId.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (item.selector?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [report.findings, severityFilter, categoryFilter, searchQuery]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bangla-ui-doctor-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectFindingById = (findingId: string) => {
    const found = report.findings.find((f) => f.id === findingId);
    if (found) setSelectedFinding(found);
  };

  return (
    <div className="relative min-h-screen bg-cyber-grid pb-20">
      <div className="pointer-events-none absolute top-0 left-1/2 h-80 w-[680px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Top Action & Context Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a101d]/85 p-5 backdrop-blur-xl lg:flex-row lg:items-center"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="size-3.5" />
                New Scan
              </Link>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
                mode: {report.languageMode}
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] text-cyan-300">
                &lt;html lang=&quot;{report.detectedHtmlLang ?? "missing"}&quot;&gt;
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                <Timer className="size-3 text-slate-500" />
                {(report.scanDurationMs / 1000).toFixed(2)}s
              </span>
            </div>

            <h1 className="font-bengali text-xl font-bold text-slate-100 sm:text-2xl">
              {report.siteTitle}
            </h1>
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <Globe className="size-3.5 text-emerald-400" />
              <span>{report.url}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Fixture Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
              {FIXTURE_PRESETS.map((preset) => {
                const active = report.fixtureKey === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/scan?fixture=${preset.key}&lang=${preset.languageMode}`
                      )
                    }
                    className={`cursor-pointer rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset.key}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
            >
              <FileJson className="size-3.5" />
              Export JSON
              <Download className="size-3" />
            </button>
          </div>
        </motion.div>

        {/* Telemetry Summary Row */}
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {/* Overall Score & Severity Counts */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-[#0b111e]/80 p-5 backdrop-blur-xl sm:flex-row sm:items-center lg:col-span-5"
          >
            <div className="flex items-center gap-5">
              <ScoreRing score={report.overallScore} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                  Diagnostic Score
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {report.overallScore >= 85
                    ? "Healthy Bengali UI"
                    : report.overallScore >= 65
                    ? "Needs Localization Polish"
                    : "Critical Barriers Detected"}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {report.findings.length} total findings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-1">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5">
                <span className="font-mono text-[11px] text-rose-300">Critical</span>
                <span className="font-mono text-sm font-bold text-rose-200">
                  {counts.critical}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5">
                <span className="font-mono text-[11px] text-amber-300">Warning</span>
                <span className="font-mono text-sm font-bold text-amber-200">
                  {counts.warning}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5">
                <span className="font-mono text-[11px] text-cyan-300">Suggest</span>
                <span className="font-mono text-sm font-bold text-cyan-200">
                  {counts.suggestion}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Category Breakdown Bars */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-2xl border border-white/10 bg-[#0b111e]/80 p-5 backdrop-blur-xl lg:col-span-7"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-slate-400">
                Category Health Breakdown
              </h2>
              <span className="font-mono text-[11px] text-emerald-400">
                Font Stack: {report.fontStackDetected.slice(0, 2).join(", ")}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.categoryScores.map((cat, idx) => (
                <div
                  key={cat.category}
                  className="rounded-xl border border-white/5 bg-black/30 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">
                      {cat.category}
                    </span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {cat.score}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.score}%` }}
                      transition={{ duration: 0.7, delay: 0.15 + idx * 0.06 }}
                      className={`h-full rounded-full ${
                        cat.score >= 85
                          ? "bg-emerald-400"
                          : cat.score >= 65
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Viewport Simulator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <ViewportSimulator
            viewports={report.viewports}
            siteTitle={report.siteTitle}
            onSelectFinding={handleSelectFindingById}
          />
        </motion.div>

        {/* Findings Explorer */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl border border-white/10 bg-[#0b111e]/80 p-5 backdrop-blur-xl"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Audit Findings &amp; Evidence
              </h2>
              <p className="text-xs text-slate-400">
                Select any finding to inspect DOM evidence, explanation, and code
                patch.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter rule, selector..."
                  className="h-9 rounded-xl border border-white/10 bg-black/40 pr-3 pl-8 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              {/* Severity Filter */}
              <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
                {SEVERITY_FILTERS.map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 font-mono text-[11px] capitalize transition-colors ${
                      severityFilter === sev
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  categoryFilter === cat
                    ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Findings List */}
          <div className="mt-4 space-y-2.5">
            {filteredFindings.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center">
                <Sparkles className="mx-auto size-6 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-slate-200">
                  No findings match the current filter.
                </p>
              </div>
            ) : (
              filteredFindings.map((finding, idx) => (
                <motion.button
                  key={finding.id}
                  type="button"
                  onClick={() => setSelectedFinding(finding)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  whileHover={{ x: 4 }}
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/35 p-4 text-left transition-colors hover:border-emerald-500/35 hover:bg-emerald-500/[0.04]"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                          finding.severity === "critical"
                            ? "bg-rose-500/20 text-rose-300"
                            : finding.severity === "warning"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {finding.severity === "critical" ? (
                          <AlertCircle className="size-3" />
                        ) : finding.severity === "warning" ? (
                          <AlertTriangle className="size-3" />
                        ) : (
                          <Info className="size-3" />
                        )}
                        {finding.severity}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {finding.category}
                      </span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                        {finding.ruleId}
                      </span>
                      {finding.requiresHumanReview && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                          human review
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-200">
                      {finding.title}
                    </h3>
                    <p className="truncate text-xs text-slate-400">
                      {finding.message}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <FindingInspectorDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </div>
  );
}
