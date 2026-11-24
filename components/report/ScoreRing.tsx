"use client";

import { motion } from "motion/react";

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 132 }: ScoreRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClass =
    progress >= 85
      ? "text-emerald-400"
      : progress >= 65
      ? "text-amber-400"
      : "text-rose-400";

  const strokeColor =
    progress >= 85 ? "#10b981" : progress >= 65 ? "#f59e0b" : "#f43f5e";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(148, 163, 184, 0.14)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            filter: `drop-shadow(0 0 10px ${strokeColor}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`font-mono text-3xl font-bold ${colorClass}`}
        >
          {progress}
        </motion.span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Health
        </span>
      </div>
    </div>
  );
}
