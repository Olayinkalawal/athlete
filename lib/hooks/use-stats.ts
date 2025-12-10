"use client";

import { useState, useEffect, useCallback } from 'react';

export interface UserStats {
  total_sessions: number;
  total_drills_completed: number;
  total_calories_burned: number;
  total_training_minutes: number;
  total_xp: number;
  avg_accuracy: number;
  current_streak: number;
  longest_streak?: number;
}

export interface ProgressEntry {
  id: string;
  completed_at: string;
  score: number;
  time_spent_seconds: number;
  xp_earned: number;
  drills?: {
    title: string;
    difficulty: string;
    xp_reward: number;
  };
}

interface UseStatsResult {
  stats: UserStats;
  recentProgress: ProgressEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_STATS: UserStats = {
  total_sessions: 0,
  total_drills_completed: 0,
  total_calories_burned: 0,
  total_training_minutes: 0,
  total_xp: 0,
  avg_accuracy: 0,
  current_streak: 0,
  longest_streak: 0,
};

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [recentProgress, setRecentProgress] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      
      setStats(data.stats || DEFAULT_STATS);
      setRecentProgress(data.recentProgress || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep existing stats on error (don't reset to defaults)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    recentProgress,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
