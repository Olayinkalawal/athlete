"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
        className
      )}
    />
  );
}

// Skeleton for stat cards
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for drill cards
export function DrillCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for video player area
export function VideoSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for session plan
export function SessionPlanSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for chat
export function ChatSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 h-[400px] flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>
      </div>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Grid of stat card skeletons
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Skeleton className="h-20 rounded-xl" />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

// Progress page skeleton
export function ProgressPageSkeleton() {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
