"use client";

import { LucideIcon, Users } from "lucide-react";
import React from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface DisciplineCardProps {
  name: string;
  count: string;
  description?: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  hiddenOnMobile?: boolean;
}

export default function DisciplineCard({ name, count, description, icon: Icon, colorClass, bgClass, hiddenOnMobile }: DisciplineCardProps) {

  return (
    <div 
        className={`w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group cursor-pointer active:scale-[0.98] shadow-sm ${hiddenOnMobile ? 'hidden md:block' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`h-8 w-8 rounded-full ${bgClass} flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] text-zinc-500 flex items-center"><Users size={10} className="mr-1" /> {count}</span>
      </div>
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 block mb-1">{name}</span>
      <span className="text-[10px] text-zinc-500 line-clamp-1">{description}</span>
    </div>
  );
}
