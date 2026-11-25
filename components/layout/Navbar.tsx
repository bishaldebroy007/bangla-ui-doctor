"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Activity, FileSearch2, Sparkles, Terminal } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#05080f]/75 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-transform duration-300 group-hover:scale-105 sm:size-9">
            <Activity className="size-4 text-emerald-400 sm:size-4.5" />
            <span className="absolute -top-1 -right-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="truncate text-xs font-bold tracking-tight text-slate-100 sm:text-base">
                Bangla UI Doctor
              </span>
              <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-cyan-300 sm:inline-block sm:px-2 sm:text-[10px]">
                v0.1 LAB
              </span>
            </div>
            <span className="hidden font-bengali text-[10px] text-slate-400 sm:inline-block sm:text-[11px]">
              বাংলা ওয়েব কোয়ালিটি ও অ্যাক্সেসিবিলিটি অডিটর
            </span>
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-sm ${
              pathname === "/"
                ? "text-emerald-300"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {pathname === "/" && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Terminal className="relative z-10 size-3 sm:size-3.5" />
            <span className="relative z-10">Scanner</span>
          </Link>

          <Link
            href="/scan?fixture=problematic"
            className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:text-sm ${
              pathname?.startsWith("/scan")
                ? "text-emerald-300"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {pathname?.startsWith("/scan") && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <FileSearch2 className="relative z-10 size-3 sm:size-3.5" />
            <span className="relative z-10">Report Lab</span>
          </Link>

          <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 lg:flex">
            <Sparkles className="size-3 text-emerald-400" />
            <span>Playwright Engine Active</span>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
