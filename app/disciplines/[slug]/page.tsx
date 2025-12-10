"use client";

import React, { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import Header from "@/components/layout/header";
import SessionPlan from "@/components/dashboard/session-plan";
import VideoPlayer from "@/components/dashboard/video-player";
import DrillCard from "@/components/dashboard/drill-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Skeleton, VideoSkeleton, SessionPlanSkeleton, DrillCardSkeleton } from "@/components/ui/skeleton";
import { DISCIPLINES } from "@/lib/data";
import { useUi } from "@/components/providers/ui-provider";
import { Play, Clock, BarChart, Users, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { handleSpotlightMove } from "@/hooks/use-spotlight";

interface Drill {
  id: string;
  title: string;
  description?: string;
  category: string;
  duration_minutes: number;
  difficulty: string;
  xp_reward: number;
  image_url?: string;
}

interface DrillCompletion {
  lastCompleted: string;
  count: number;
}

export default function DisciplinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get('video');
  const initialAnalysisId = searchParams.get('analysis');
  const [isLoading, setIsLoading] = useState(true);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [completions, setCompletions] = useState<Record<string, DrillCompletion>>({});
  const [completingDrill, setCompletingDrill] = useState<string | null>(null);
  const { updateSessionStats, refetchStats } = useUi();
  
  const discipline = DISCIPLINES.find(d => d.slug === slug);
  
  // Fetch drills from database
  const fetchDrills = useCallback(async () => {
    try {
      const [drillsRes, completionsRes] = await Promise.all([
        fetch(`/api/drills?discipline=${slug}`),
        fetch('/api/drills/complete')
      ]);
      
      if (drillsRes.ok) {
        const data = await drillsRes.json();
        setDrills(data.drills || []);
      }
      
      if (completionsRes.ok) {
        const data = await completionsRes.json();
        setCompletions(data.completions || {});
      }
    } catch (error) {
      console.error('Failed to fetch drills:', error);
    }
  }, [slug]);
  
  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await fetchDrills();
      setIsLoading(false);
    };
    loadData();
  }, [fetchDrills]);
  
  // Handle drill completion
  const [disappearingDrills, setDisappearingDrills] = useState<Set<string>>(new Set());
  
  const handleCompleteDrill = async (drillId: string) => {
    if (completingDrill) return; // Prevent double-clicks
    
    setCompletingDrill(drillId);
    
    try {
      const res = await fetch('/api/drills/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drillId, timeSpentSeconds: 900 }) // Assume 15 min
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Trigger disappearing animation
        setDisappearingDrills(prev => new Set(prev).add(drillId));
        
        // Update local completions
        setCompletions(prev => ({
          ...prev,
          [drillId]: {
            lastCompleted: new Date().toISOString(),
            count: (prev[drillId]?.count || 0) + 1
          }
        }));
        
        // Update local stats for immediate feedback
        updateSessionStats({
          completedDrills: 1,
          totalXp: data.xpEarned,
          caloriesBurned: Math.floor(Math.random() * 30) + 20
        });
        
        // Refresh stats from server
        await refetchStats();
        
        toast.success(`Drill Complete! 🎉`, {
          description: `+${data.xpEarned} XP earned for "${data.message.replace('Completed "', '').replace('"', '')}"`
        });
        
        // If custom drill was deleted, remove from local state after animation
        if (data.customDrillDeleted) {
          setTimeout(() => {
            // Remove from drills array so grid reflows smoothly
            setDrills(prev => prev.filter(d => d.id !== drillId));
            setDisappearingDrills(prev => {
              const next = new Set(prev);
              next.delete(drillId);
              return next;
            });
          }, 500); // Match animation duration
        }
      } else {
        throw new Error('Failed to complete drill');
      }
    } catch (error) {
      console.error('Completion error:', error);
      toast.error('Failed to record completion');
    } finally {
      setCompletingDrill(null);
    }
  };
  
  if (!discipline) {
    notFound();
  }

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
        <Header />
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-4 w-28" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          
          {/* Main grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <VideoSkeleton />
              <div>
                <Skeleton className="h-4 w-28 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DrillCardSkeleton />
                  <DrillCardSkeleton />
                  <DrillCardSkeleton />
                  <DrillCardSkeleton />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <SessionPlanSkeleton />
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
                <Skeleton className="h-3 w-24 mb-3" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
      <Header />
      
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <ScrollReveal className="space-y-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Overview
          </Link>
          
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${discipline.bgClass} flex items-center justify-center ${discipline.colorClass}`}>
              {/* Icon removed to fix build error */}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">{discipline.name}</h1>
              <p className="text-zinc-500 text-sm">{discipline.description}</p>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Users size={14} />
              <span>{discipline.count} athletes</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <BarChart size={14} />
              <span>{drills.length || discipline.drills?.length || 0} drills available</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Content Section */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Video Player with AI Analysis */}
            <VideoPlayer 
              discipline={slug}
              initialVideoId={initialVideoId || undefined}
              initialAnalysisId={initialAnalysisId || undefined}
              onDrillsGenerated={fetchDrills}
            />
            
            {/* Drills Section */}
            <ScrollReveal>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Available Drills</h2>
                {Object.keys(completions).length > 0 && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                    {Object.values(completions).reduce((sum, c) => sum + c.count, 0)} completions
                  </span>
                )}
              </div>
              
              {drills.length > 0 ? (
                <div className="drill-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drills.map((drill) => (
                    <DrillCard
                      key={drill.id}
                      id={drill.id}
                      title={drill.title}
                      category={drill.category}
                      image_url={drill.image_url}
                      difficulty={drill.difficulty}
                      duration_minutes={drill.duration_minutes}
                      xp_reward={drill.xp_reward}
                      description={drill.description}
                      isCompleted={!!completions[drill.id]}
                      completionCount={completions[drill.id]?.count || 0}
                      isDisappearing={disappearingDrills.has(drill.id)}
                      onComplete={handleCompleteDrill}
                    />
                  ))}
                </div>
              ) : (
                // Fallback to static drills if database drills not available
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discipline.drills?.map((drill, i) => (
                    <div 
                      key={i}
                      className="spotlight-card group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
                      onMouseMove={handleSpotlightMove}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">{drill}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1"><Clock size={10} /> 10-15 min</span>
                            <span className="flex items-center gap-1"><BarChart size={10} /> +{15 + (i * 5)} XP</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toast.info(`Database drills not configured. Run the SQL schema in Supabase.`)}
                          className="h-8 w-8 rounded-full bg-zinc-400 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollReveal>
            
            {/* Quick Start */}
            <ScrollReveal delay={100}>
              <div className="spotlight-card p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-zinc-50 dark:to-zinc-900/20 shadow-sm" onMouseMove={handleSpotlightMove}>
                <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">Ready to train?</h3>
                  <p className="text-xs text-zinc-500">Start a full {discipline.name} session with AI coaching</p>
                </div>
                <button 
                  onClick={() => toast.success(`Starting ${discipline.name} training session...`)}
                  className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Play size={14} />
                  Start Session
                </button>
              </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <SessionPlan />
            
            {/* Discipline Stats */}
            <ScrollReveal>
              <div className="spotlight-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 relative z-10">Your Progress</h3>
                <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Sessions Completed</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Avg. Accuracy</span>
                  <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Total Time</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">12h 30m</span>
                </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </main>
  );
}
