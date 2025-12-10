"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Video, FileQuestion, History, Target, Upload } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        {icon || <FileQuestion className="text-zinc-400 dark:text-zinc-500" size={28} />}
      </div>
      <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-[200px] mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-built empty states
export function NoVideosEmpty({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={<Video className="text-zinc-400 dark:text-zinc-500" size={28} />}
      title="No videos yet"
      description="Upload your first training video to get AI-powered analysis"
      action={onUpload ? { label: "Upload Video", onClick: onUpload } : undefined}
    />
  );
}

export function NoAnalysesEmpty() {
  return (
    <EmptyState
      icon={<History className="text-zinc-400 dark:text-zinc-500" size={28} />}
      title="No analyses yet"
      description="Analyze a video to see AI-powered feedback on your technique"
    />
  );
}

export function NoDrillsEmpty() {
  return (
    <EmptyState
      icon={<Target className="text-zinc-400 dark:text-zinc-500" size={28} />}
      title="No Custom Drills Yet"
      description="Upload a training video and run AI analysis to generate personalized drills targeting your weaknesses"
    />
  );
}

export function NoActivityEmpty() {
  return (
    <EmptyState
      icon={<History className="text-zinc-400 dark:text-zinc-500" size={28} />}
      title="No recent activity"
      description="Complete drills and train to see your activity here"
    />
  );
}
