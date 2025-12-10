"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { NoActivityEmpty } from "@/components/ui/empty-state";
import { Skeleton, StatCardSkeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Target, Clock, TrendingUp, Zap, Calendar, ChevronDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { handleSpotlightMove } from "@/hooks/use-spotlight";

interface ProgressData {
  dailyXp: { date: string; xp: number }[];
  recentActivity: { id: string; title: string; xp: number; completedAt: string }[];
  stats: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    totalDrills: number;
    totalMinutes: number;
    level: number;
    xpToNextLevel: number;
  };
  weeklyProgress?: {
    current: number;
    goal: number;
    percentage: number;
  };
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?days=${days}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgress();
  }, [days]);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto h-full bg-zinc-50 dark:bg-black custom-scrollbar">
        <Header />
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
          {/* Title skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
          
          {/* Level card skeleton */}
          <Skeleton className="h-32 w-full rounded-2xl" />
          
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6">
              <Skeleton className="h-4 w-24 mb-6" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6">
              <Skeleton className="h-4 w-28 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const stats = data?.stats || { totalXp: 0, currentStreak: 0, longestStreak: 0, totalDrills: 0, totalMinutes: 0, level: 1, xpToNextLevel: 100 };
  const levelProgress = ((100 - stats.xpToNextLevel) / 100) * 100;

  return (
    <main className="flex-1 overflow-y-auto h-full bg-zinc-50 dark:bg-black custom-scrollbar">
      <Header />
      
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Page Title */}
        <ScrollReveal>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Progress</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your training journey and improvements</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDays(7)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${days === 7 ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setDays(30)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${days === 30 ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                30 Days
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Level Card */}
        <ScrollReveal delay={50}>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {stats.level}
                </div>
                <div>
                  <p className="text-white/70 text-sm">Current Level</p>
                  <p className="text-xl font-bold">{stats.totalXp.toLocaleString()} XP</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">{stats.xpToNextLevel} XP to Level {stats.level + 1}</p>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScrollReveal delay={100}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="text-orange-500" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white relative z-10">{stats.currentStreak}</p>
              <p className="text-xs text-zinc-500 relative z-10">Day Streak</p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={150}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target className="text-emerald-500" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white relative z-10">{stats.totalDrills}</p>
              <p className="text-xs text-zinc-500 relative z-10">Drills Completed</p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Clock className="text-indigo-500" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white relative z-10">{stats.totalMinutes}</p>
              <p className="text-xs text-zinc-500 relative z-10">Minutes Trained</p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={250}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="text-yellow-500" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white relative z-10">{stats.longestStreak}</p>
              <p className="text-xs text-zinc-500 relative z-10">Longest Streak</p>
            </div>
          </ScrollReveal>
        </div>

        {/* Weekly Goal Card */}
        {data?.weeklyProgress && (
          <ScrollReveal delay={275} className="mt-6 mb-2">
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Calendar className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Weekly Goal</h3>
                    <p className="text-sm text-zinc-500">{data.weeklyProgress.current} / {data.weeklyProgress.goal} sessions completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-white">{data.weeklyProgress.percentage}%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative z-10">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${data.weeklyProgress.percentage}%` }}
                />
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* XP Chart */}
          <ScrollReveal delay={300}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">XP Earned</h3>
                  <p className="text-xs text-zinc-500">Last {days} days</p>
                </div>
                <TrendingUp className="text-indigo-500" size={20} />
              </div>
              
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.dailyXp || []}>
                    <defs>
                      <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="xp" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fill="url(#xpGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>

          {/* Recent Activity */}
          <ScrollReveal delay={350}>
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
                  <p className="text-xs text-zinc-500">Your latest completions</p>
                </div>
                <Calendar className="text-zinc-400" size={20} />
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                {data?.recentActivity && data.recentActivity.length > 0 ? (
                  data.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Zap className="text-indigo-500" size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{activity.title}</p>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(activity.completedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-500">+{activity.xp} XP</span>
                    </div>
                  ))
                ) : (
                  <NoActivityEmpty />
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
