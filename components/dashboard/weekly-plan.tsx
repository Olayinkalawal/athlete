"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, Zap, Sparkles, ChevronRight, Check, Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { handleSpotlightMove } from "@/hooks/use-spotlight";

interface PlanDrill {
    title: string;
    duration: number;
    xp: number;
    notes: string;
}

interface DayPlan {
    day: number;
    name: string;
    focus: string;
    drills: PlanDrill[];
    restDay: boolean;
    totalMinutes: number;
    totalXp: number;
}

interface WeeklyPlan {
    weekStart: string;
    discipline: string;
    days: DayPlan[];
    generatedAt: string;
}

export default function WeeklyPlanSection() {
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    // Get today's day number (1 = Monday, 7 = Sunday)
    const today = new Date();
    const todayDay = today.getDay() === 0 ? 7 : today.getDay();

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const res = await fetch('/api/training-plan');
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan);
            }
        } catch (error) {
            console.error('Failed to fetch plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePlan = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/training-plan', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan);
            }
        } catch (error) {
            console.error('Failed to generate plan:', error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="spotlight-card p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <ScrollReveal>
                <div
                    className="spotlight-card p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-zinc-50 dark:to-zinc-900/20"
                    onMouseMove={handleSpotlightMove}
                >
                    <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                            AI Weekly Training Plan
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                            Let AI create a personalized 7-day training plan based on your goals and progress.
                        </p>
                        <button
                            onClick={generatePlan}
                            disabled={generating}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating Plan...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate My Plan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </ScrollReveal>
        );
    }

    return (
        <ScrollReveal>
            <div
                className="spotlight-card rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden"
                onMouseMove={handleSpotlightMove}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Calendar className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white">Weekly Plan</h3>
                            <p className="text-xs text-zinc-500 capitalize">{plan.discipline} Training</p>
                        </div>
                    </div>
                    <button
                        onClick={generatePlan}
                        disabled={generating}
                        className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                    >
                        {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Regenerate
                    </button>
                </div>

                {/* Days */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {plan.days.map((day) => (
                        <div key={day.day}>
                            <button
                                onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                                className={`w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${day.day === todayDay ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${day.restDay
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                            : day.day === todayDay
                                                ? 'bg-blue-500 text-white'
                                                : day.day < todayDay
                                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                        }`}>
                                        {day.day < todayDay && !day.restDay ? <Check size={14} /> : day.name.slice(0, 2)}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${day.day === todayDay ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-200'
                                            }`}>
                                            {day.name}
                                            {day.day === todayDay && <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">TODAY</span>}
                                        </p>
                                        <p className="text-xs text-zinc-500">{day.restDay ? '🧘 Rest Day' : day.focus}</p>
                                    </div>
                                </div>
                                {!day.restDay && (
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                <Clock size={10} /> {day.totalMinutes} min
                                            </p>
                                            <p className="text-xs text-blue-500 flex items-center gap-1">
                                                <Zap size={10} /> {day.totalXp} XP
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className={`text-zinc-400 transition-transform ${expandedDay === day.day ? 'rotate-90' : ''}`}
                                        />
                                    </div>
                                )}
                            </button>

                            {/* Expanded drills */}
                            {expandedDay === day.day && !day.restDay && (
                                <div className="px-4 pb-4 space-y-2">
                                    {day.drills.map((drill, i) => (
                                        <div
                                            key={i}
                                            className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{drill.title}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">{drill.notes}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-4">
                                                    <p className="text-xs text-zinc-400">{drill.duration} min</p>
                                                    <p className="text-xs text-blue-500">+{drill.xp} XP</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
