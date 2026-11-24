"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Info,
  ShieldQuestion,
  X,
} from "lucide-react";
import type { AuditFinding } from "@/types/audit";

interface FindingInspectorDrawerProps {
  finding: AuditFinding | null;
  onClose: () => void;
}

export function FindingInspectorDrawer({
  finding,
  onClose,
}: FindingInspectorDrawerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  return (
    <AnimatePresence>
      {finding && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/15 bg-[#070c16]/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase ${
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
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
                    confidence: {finding.confidence}
                  </span>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
                    {finding.ruleId}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  {finding.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close inspector"
                className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {finding.requiresHumanReview && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                  <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div>
                    <strong className="font-semibold">
                      Heuristic Finding — Human Review Recommended
                    </strong>
                    <p className="mt-0.5 text-amber-200/80">
                      This check flags a likely localization or consistency pattern
                      rather than a guaranteed defect.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                  Diagnostic Summary
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                  {finding.message}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {finding.explanation}
                </p>
              </div>

              {finding.selector && (
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                    Affected DOM Selector
                  </h3>
                  <div className="mt-1.5 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-xs text-cyan-300">
                    {finding.selector}
                  </div>
                </div>
              )}

              {finding.evidence && (
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
                    Captured Evidence
                  </h3>
                  <pre className="mt-1.5 overflow-x-auto rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 font-mono text-xs leading-relaxed text-rose-200">
                    <code>{finding.evidence}</code>
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-emerald-400">
                  Recommended Fix
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                  {finding.recommendation}
                </p>
              </div>

              {finding.codeFix && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-slate-400">
                      <Code2 className="size-3.5 text-emerald-400" />
                      Suggested Patch
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(finding.codeFix!)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-300 hover:bg-white/10"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="mt-1.5 overflow-x-auto rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 font-mono text-xs leading-relaxed text-emerald-200">
                    <code>{finding.codeFix}</code>
                  </pre>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
