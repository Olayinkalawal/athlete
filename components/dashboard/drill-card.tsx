"use client";

import { Clock, BarChart, Play, Check, Trophy } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface DrillCardProps {
  id?: string;
  title: string;
  category: string;
  image_url?: string;
  image?: string; // Legacy support
  difficulty?: string;
  level?: string; // Legacy support
  duration_minutes?: number;
  duration?: string; // Legacy support
  xp_reward?: number;
  description?: string;
  isCompleted?: boolean;
  completionCount?: number;
  isDisappearing?: boolean; // For exit animation
  onComplete?: (id: string) => void;
}

export default function DrillCard({ 
  id,
  title, 
  category, 
  image_url, 
  image,
  difficulty,
  level,
  duration_minutes,
  duration,
  xp_reward = 20,
  description,
  isCompleted = false,
  completionCount = 0,
  isDisappearing = false,
  onComplete
}: DrillCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const displayLevel = difficulty || level || 'intermediate';
  const displayDuration = duration || `${duration_minutes || 15}m`;
  const displayImage = image_url || image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800';
  
  const handleComplete = () => {
    if (id && onComplete) {
      setIsAnimating(true);
      onComplete(id);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const levelColors = {
    beginner: 'text-green-600 dark:text-green-400 bg-green-500/10',
    intermediate: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
    advanced: 'text-red-600 dark:text-red-400 bg-red-500/10'
  };

  return (
    <ScrollReveal className={`group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm ${
      isDisappearing ? 'animate-[fadeOutRight_0.5s_ease-in-out_forwards]' : ''
    }`}>
      {/* Completion Badge */}
      {completionCount > 0 && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          <Check size={10} />
          {completionCount}x
        </div>
      )}
      
      {/* Gradient Overlay - Theme Aware */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-black/90 dark:via-black/40 z-10 transition-colors duration-300"></div>
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-zinc-200 dark:bg-zinc-800">
         <Image 
            src={imgError ? "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800" : displayImage} 
            alt={title}
            fill
            className={`object-cover transition-all duration-700 ${imgError ? 'opacity-20' : 'opacity-60 dark:opacity-50 group-hover:scale-105'}`}
            onError={() => setImgError(true)}
         />
      </div>

      <div className="relative z-20 p-4 h-full flex flex-col justify-end min-h-[140px]">
        <div className="flex justify-between items-start mb-auto">
             <span className="text-[10px] font-medium bg-zinc-100/80 dark:bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-zinc-200/50 dark:border-white/5 text-zinc-600 dark:text-zinc-200">{category}</span>
             <span className={`text-[10px] font-bold px-2 py-1 rounded capitalize ${levelColors[displayLevel.toLowerCase() as keyof typeof levelColors] || levelColors.intermediate}`}>{displayLevel}</span>
        </div>

        <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 line-clamp-1">{title}</h3>
            {description && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-1">{description}</p>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1"><Clock size={10} /> {displayDuration}</span>
                    <span className="flex items-center gap-1"><Trophy size={10} /> +{xp_reward} XP</span>
                </div>
                <button 
                    onClick={handleComplete}
                    disabled={!id || !onComplete}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isAnimating 
                        ? 'bg-emerald-500 scale-110' 
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-110 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/50'
                    } text-white`}
                >
                    {isAnimating ? <Check size={14} /> : <Play size={14} fill="currentColor" />}
                </button>
            </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
