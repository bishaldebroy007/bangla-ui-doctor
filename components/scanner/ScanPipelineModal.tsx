"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Cpu, Globe, ShieldCheck, Sparkles } from "lucide-react";
import type { LanguageMode } from "@/types/audit";

interface ScanPipelineModalProps {
  isOpen: boolean;
  targetUrl: string;
  languageMode: LanguageMode;
  onComplete: () => void;
}

const PIPELINE_STAGES = [
  {
    id: "ssrf",
    label: "URL & SSRF Network Guard",
    detail: "Validating HTTP/HTTPS scheme & public DNS resolution...",
  },
  {
    id: "playwright",
    label: "Isolated Playwright Browser Boot",
    detail: "Loading DOM & capturing 360px / 768px / 1440px viewports...",
  },
  {
    id: "axe",
    label: "axe-core Accessibility Engine",
    detail: "Auditing ARIA roles, alt text, form labels & contrast...",
  },
  {
    id: "bengali",
    label: "Bengali Unicode & Script Analyzer",
    detail: "Scanning U+FFFD glyphs, NFC normalization & numeral rules...",
  },
  {
    id: "rules",
    label: "Rule Engine Synthesis",
    detail: "Scoring findings, confidence levels & evidence snippets...",
  },
];

export function ScanPipelineModal({
  isOpen,
  targetUrl,
  languageMode,
  onComplete,
}: ScanPipelineModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ScanPipelineContent
          targetUrl={targetUrl}
          languageMode={languageMode}
          onComplete={onComplete}
        />
      )}
    </AnimatePresence>
  );
}

function ScanPipelineContent({
  targetUrl,
  languageMode,
  onComplete,
}: Omit<ScanPipelineModalProps, "isOpen">) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const stepTimers = PIPELINE_STAGES.map((_, idx) =>
      setTimeout(() => {
        setActiveIndex(idx);
      }, idx * 520)
    );

    const doneTimer = setTimeout(() => {
      onComplete();
    }, PIPELINE_STAGES.length * 520 + 350);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const progressPct = Math.min(
    100,
    Math.round(((activeIndex + 1) / PIPELINE_STAGES.length) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#080d18]/95 p-6 shadow-[0_0_60px_rgba(16,185,129,0.2)]"
      >
        {/* Animated scanning laser line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden">
          <div className="animate-scan-beam h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_#10b981]" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <Cpu className="size-5 text-emerald-400" />
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0 rounded-xl border border-dashed border-cyan-400/40"
              />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-400">
                Diagnostic Telemetry Active
              </p>
              <h3 className="text-lg font-semibold text-slate-100">
                Scanning Target Interface
              </h3>
            </div>
          </div>

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-300">
            mode: {languageMode}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-300">
          <Globe className="size-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">{targetUrl}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400">Worker Pipeline</span>
            <span className="text-emerald-400">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-300"
              initial={{ width: "8%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="mt-5 space-y-2.5">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0.4, x: -6 }}
                animate={{
                  opacity: idx <= activeIndex ? 1 : 0.35,
                  x: 0,
                }}
                className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  isCurrent
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : isDone
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-white/5 bg-transparent"
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Sparkles className="size-4 animate-pulse text-cyan-400" />
                  ) : (
                    <ShieldCheck className="size-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200">
                    {stage.label}
                  </p>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    {stage.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
