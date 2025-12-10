import { LucideIcon } from "lucide-react";
import React from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface StatsCardProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  subtextClass?: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  chartPath: string;
  delay?: number;
}

export default function StatsCard({
  label,
  value,
  unit,
  subtext,
  subtextClass,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  chartPath,
  delay = 0
}: StatsCardProps) {
  return (
    <ScrollReveal delay={delay} className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all relative overflow-hidden shadow-sm">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
          <span className={`p-1 rounded ${iconBgClass} ${iconColorClass}`}>
            <Icon size={14} strokeWidth={1.5} />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {value}
            {unit && <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>}
          </span>
          {subtext && <span className={`text-[10px] flex items-center ${subtextClass}`}>{subtext}</span>}
        </div>
      </div>
      <svg className="absolute bottom-0 right-0 w-24 h-12 text-zinc-300 dark:text-zinc-800 opacity-20 group-hover:opacity-40 transition-opacity" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={chartPath}></path>
      </svg>
    </ScrollReveal>
  );
}
