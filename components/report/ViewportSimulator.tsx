"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Monitor, Smartphone, Tablet } from "lucide-react";
import type { ViewportProfile, ViewportSnapshot } from "@/types/audit";

interface ViewportSimulatorProps {
  viewports: ViewportSnapshot[];
  siteTitle: string;
  onSelectFinding: (findingId: string) => void;
}

const PROFILE_META: Record<
  ViewportProfile,
  { icon: typeof Smartphone; frameWidth: string }
> = {
  mobile: { icon: Smartphone, frameWidth: "max-w-[320px]" },
  tablet: { icon: Tablet, frameWidth: "max-w-[460px]" },
  desktop: { icon: Monitor, frameWidth: "max-w-full" },
};

export function ViewportSimulator({
  viewports,
  siteTitle,
  onSelectFinding,
}: ViewportSimulatorProps) {
  const [activeProfile, setActiveProfile] = useState<ViewportProfile>("mobile");
  const activeViewport =
    viewports.find((v) => v.profile === activeProfile) ?? viewports[0];

  const meta = PROFILE_META[activeViewport.profile];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b111e]/80 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 sm:text-[11px]">
            Responsive Visual Telemetry
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-100">
            Viewport Overflow &amp; Rendering Inspector
          </h3>
        </div>

        {/* Viewport Switcher */}
        <div className="flex max-w-full flex-wrap rounded-xl border border-white/10 bg-black/40 p-1 sm:inline-flex">
          {viewports.map((vp) => {
            const Icon = PROFILE_META[vp.profile].icon;
            const isActive = vp.profile === activeProfile;
            return (
              <button
                key={vp.profile}
                type="button"
                onClick={() => setActiveProfile(vp.profile)}
                className={`relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-colors sm:px-3 sm:py-1.5 ${
                  isActive ? "text-cyan-200" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="viewport-tab-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-lg border border-cyan-500/40 bg-cyan-500/15"
                  />
                )}
                <Icon className="relative z-10 size-3 sm:size-3.5" />
                <span className="relative z-10">
                  <span>{vp.label}</span>{" "}
                  <span className="hidden xs:inline text-[11px] opacity-75">
                    ({vp.widthPx}px)
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Telemetry Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 font-mono text-[11px] sm:gap-3 sm:px-3.5 sm:py-2.5 sm:text-xs">
        <span className="flex items-center gap-1.5">
          {activeViewport.status === "pass" ? (
            <CheckCircle2 className="size-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle
              className={`size-3.5 ${
                activeViewport.status === "fail"
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            />
          )}
          <span className="text-slate-300">
            Horizontal Overflow:{" "}
            <strong
              className={
                activeViewport.overflowDetected
                  ? "text-rose-400"
                  : "text-emerald-400"
              }
            >
              {activeViewport.overflowDetected ? "DETECTED" : "NONE"}
            </strong>
          </span>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="text-slate-300">
          Clipped Elements:{" "}
          <strong
            className={
              activeViewport.clippedElements > 0
                ? "text-amber-400"
                : "text-emerald-400"
            }
          >
            {activeViewport.clippedElements}
          </strong>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="text-slate-400">
          Click highlighted overlays below to inspect evidence
        </span>
      </div>

      {/* Simulated Browser Frame */}
      <div className="mt-4 flex justify-center overflow-x-auto rounded-xl border border-white/5 bg-[#05080f] p-3 sm:mt-5 sm:p-6">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className={`relative w-full ${meta.frameWidth} overflow-hidden rounded-xl border border-white/15 bg-[#0f172a] shadow-2xl`}
        >
          {/* Fake Browser Chrome */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500/70" />
              <span className="size-2.5 rounded-full bg-amber-500/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="truncate px-3 font-mono text-[10px] text-slate-400">
              {activeViewport.widthPx}px × auto
            </span>
            <span className="font-mono text-[10px] text-cyan-400">
              Playwright
            </span>
          </div>

          {/* Simulated Bengali Page Canvas */}
          <div className="relative h-64 space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="truncate font-bengali text-xs font-semibold text-slate-200">
                {siteTitle}
              </span>
              <div className="flex gap-1.5">
                <span className="h-2 w-8 rounded bg-slate-700" />
                <span className="h-2 w-8 rounded bg-slate-700" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bengali text-sm font-bold text-slate-100">
                {activeViewport.highlights.some((h) => h.label.includes("U+FFFD"))
                  ? "বাংলাদেশের ডিজিটাল সেবা উন্নয় নতুন দক্ষেপ"
                  : "বাংলাদেশের ডিজিটাল সেবা উন্নয়নে নতুন পদক্ষেপ"}
              </div>
              <p className="font-bengali text-xs leading-relaxed text-slate-400">
                নাগরিক সেবা সহজ করতে আধুনিক ওয়েব মানদণ্ড, সঠিক ইউনিকোড এবং
                অ্যাক্সেসিবিলিটি নিশ্চিত করা জরুরি।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="h-14 rounded-lg border border-white/10 bg-slate-800/70 p-2">
                <div className="h-2 w-16 rounded bg-slate-600" />
                <div className="mt-2 h-2 w-24 rounded bg-slate-700" />
              </div>
              <div className="h-14 rounded-lg border border-white/10 bg-slate-800/70 p-2">
                <div className="h-2 w-14 rounded bg-slate-600" />
                <div className="mt-2 h-2 w-20 rounded bg-slate-700" />
              </div>
            </div>

            <div className="pt-1">
              <span className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1.5 font-bengali text-xs text-emerald-300">
                বিস্তারিত সংবাদ পড়ুন
              </span>
            </div>

            {/* Interactive Issue Bounding-Box Overlays */}
            {activeViewport.highlights.map((hl) => {
              const isCritical = hl.severity === "critical";
              return (
                <motion.button
                  key={hl.id}
                  type="button"
                  onClick={() => onSelectFinding(hl.findingId)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    left: `${hl.xPct}%`,
                    top: `${hl.yPct}%`,
                    width: `${hl.wPct}%`,
                    height: `${hl.hPct}%`,
                  }}
                  className={`absolute cursor-pointer rounded-md border-2 border-dashed transition-colors ${
                    isCritical
                      ? "border-rose-500 bg-rose-500/15 hover:bg-rose-500/25"
                      : "border-amber-400 bg-amber-400/15 hover:bg-amber-400/25"
                  }`}
                >
                  <span
                    className={`absolute -top-5 left-0 max-w-[120px] truncate rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold shadow sm:max-w-none ${
                      isCritical
                        ? "bg-rose-500 text-white"
                        : "bg-amber-400 text-slate-950"
                    }`}
                  >
                    {hl.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
