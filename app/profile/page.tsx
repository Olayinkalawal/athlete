"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Skeleton } from "@/components/ui/skeleton";
import {
    User,
    Trophy,
    Flame,
    Target,
    Clock,
    Zap,
    TrendingUp,
    Calendar,
    Award,
    ChevronRight,
    Settings
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
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
        totalSessions: number;
    };
    weeklyProgress?: {
        current: number;
        goal: number;
        percentage: number;
    };
}

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch('/api/progress?days=30');
                if (res.ok) {
                    const data = await res.json();
                    setProgress(data);
                }
            } catch (error) {
                console.error('Failed to load progress:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const stats = progress?.stats;
    const level = stats?.level || 1;
    const xpProgress = stats ? ((100 - stats.xpToNextLevel) / 100) * 100 : 0;

    return (
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-black">
            <Header />

            <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                <ScrollReveal>
                    {/* Profile Header Card */}
                    <div
                        className="spotlight-card bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
                        onMouseMove={handleSpotlightMove}
                    >
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                                    <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                                        {isLoaded && user?.imageUrl ? (
                                            <Image
                                                src={user.imageUrl}
                                                alt={user.fullName || "Profile"}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <User size={40} className="text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Level Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full border-2 border-white dark:border-zinc-900">
                                    Lv.{level}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                {isLoaded ? (
                                    <>
                                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                                            {user?.fullName || 'Athlete'}
                                        </h1>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                                            {user?.primaryEmailAddress?.emailAddress}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Skeleton className="h-7 w-40 mb-2" />
                                        <Skeleton className="h-4 w-56 mb-3" />
                                    </>
                                )}

                                {/* XP Progress Bar */}
                                <div className="max-w-xs mx-auto md:mx-0">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-zinc-600 dark:text-zinc-400">Level {level}</span>
                                        <span className="text-zinc-500">{stats?.xpToNextLevel || 100} XP to next</span>
                                    </div>
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${xpProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Settings Link */}
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                            >
                                <Settings size={16} />
                                Settings
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Stats Grid */}
                <ScrollReveal delay={0.1}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-xl" />
                            ))
                        ) : (
                            <>
                                <StatCard
                                    icon={<Zap className="text-yellow-500" />}
                                    label="Total XP"
                                    value={stats?.totalXp?.toLocaleString() || '0'}
                                />
                                <StatCard
                                    icon={<Flame className="text-orange-500" />}
                                    label="Current Streak"
                                    value={`${stats?.currentStreak || 0} days`}
                                />
                                <StatCard
                                    icon={<Target className="text-blue-500" />}
                                    label="Drills Completed"
                                    value={stats?.totalDrills?.toString() || '0'}
                                />
                                <StatCard
                                    icon={<Clock className="text-purple-500" />}
                                    label="Training Time"
                                    value={`${stats?.totalMinutes || 0} min`}
                                />
                            </>
                        )}
                    </div>
                </ScrollReveal>

                {/* Weekly Goal & Achievements */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Weekly Goal */}
                    <ScrollReveal delay={0.2}>
                        <div
                            className="spotlight-card bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
                            onMouseMove={handleSpotlightMove}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="text-blue-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">Weekly Goal</h3>
                                    <p className="text-xs text-zinc-500">Sessions this week</p>
                                </div>
                            </div>

                            {loading ? (
                                <Skeleton className="h-4 w-full rounded-full" />
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {progress?.weeklyProgress?.current || 0} / {progress?.weeklyProgress?.goal || 5} sessions
                                        </span>
                                        <span className="font-medium text-blue-500">
                                            {progress?.weeklyProgress?.percentage || 0}%
                                        </span>
                                    </div>
                                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progress?.weeklyProgress?.percentage || 0}%` }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollReveal>

                    {/* Achievements Teaser */}
                    <ScrollReveal delay={0.3}>
                        <div
                            className="spotlight-card bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
                            onMouseMove={handleSpotlightMove}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Award className="text-amber-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">Achievements</h3>
                                    <p className="text-xs text-zinc-500">Your training milestones</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {stats?.totalDrills && stats.totalDrills >= 1 && (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center" title="First Drill">
                                        <Trophy className="text-emerald-500" size={18} />
                                    </div>
                                )}
                                {stats?.currentStreak && stats.currentStreak >= 3 && (
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center" title="3-Day Streak">
                                        <Flame className="text-orange-500" size={18} />
                                    </div>
                                )}
                                {level >= 5 && (
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center" title="Level 5">
                                        <TrendingUp className="text-purple-500" size={18} />
                                    </div>
                                )}
                                {(!stats?.totalDrills || stats.totalDrills === 0) && (
                                    <p className="text-sm text-zinc-500">Complete drills to earn badges!</p>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Recent Activity */}
                <ScrollReveal delay={0.4}>
                    <div
                        className="spotlight-card bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
                        onMouseMove={handleSpotlightMove}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <TrendingUp className="text-blue-500" size={20} />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
                            </div>
                            <Link href="/progress" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-12 rounded-lg" />
                                ))}
                            </div>
                        ) : progress?.recentActivity && progress.recentActivity.length > 0 ? (
                            <div className="space-y-2">
                                {progress.recentActivity.slice(0, 5).map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Target className="text-blue-500" size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white">{activity.title}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {new Date(activity.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-500">+{activity.xp} XP</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Target className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
                                <p className="text-sm text-zinc-500">No activity yet</p>
                                <p className="text-xs text-zinc-400">Complete drills to see your progress here</p>
                            </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>
        </main>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div
            className="spotlight-card bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
            onMouseMove={handleSpotlightMove}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
        </div>
    );
}
