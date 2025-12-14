"use client";

// Disable static generation to avoid Clerk API calls during build
import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import AiChat from "@/components/dashboard/ai-chat";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Skeleton, ChatSkeleton } from "@/components/ui/skeleton";
import { Bot, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";
import { handleSpotlightMove } from "@/hooks/use-spotlight";

export default function AiCoachPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Brief loading for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
        <Header />
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>

          {/* Chat skeleton */}
          <div className="h-[calc(100vh-280px)] min-h-[500px]">
            <ChatSkeleton />
          </div>

          {/* Quick prompts skeleton */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <Skeleton className="h-3 w-24 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main id="main-scroll" className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
      <Header />

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <ScrollReveal className="space-y-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">AI Coach</h1>
              <p className="text-zinc-500 text-sm">Your personal training assistant powered by AI</p>
            </div>
            <span className="ml-auto px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-medium border border-indigo-500/20">BETA</span>
          </div>
        </ScrollReveal>

        {/* Full-width Chat */}
        <ScrollReveal data-tour="aicoach-chat">
          <div className="h-[calc(100vh-280px)] min-h-[500px]">
            <AiChat />
          </div>
        </ScrollReveal>

        {/* Quick Prompts Row */}
        <ScrollReveal delay={50} data-tour="aicoach-quick-prompts">
          <div className="spotlight-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 relative z-10">Quick Prompts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
              {[
                { icon: Target, text: "Analyze my last session" },
                { icon: TrendingUp, text: "Show my weekly progress" },
                { icon: Zap, text: "Suggest a warmup routine" },
                { icon: Lightbulb, text: "Tips for improving accuracy" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="text-left px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2 transition-all hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <item.icon size={14} className="text-zinc-400 dark:text-zinc-500" />
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
