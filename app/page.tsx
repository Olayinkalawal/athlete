"use client";

import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";

// Lazy load landing page (only needed for signed-out users)
const LandingPage = lazy(() => import("@/components/landing/landing-page"));
import Header from "@/components/layout/header";
// Lazy load heavy components for better performance
const AiChat = lazy(() => import("@/components/dashboard/ai-chat"));
const SessionPlan = lazy(() => import("@/components/dashboard/session-plan"));
const DisciplineCard = lazy(() => import("@/components/dashboard/discipline-card"));

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { NoAnalysesEmpty } from "@/components/ui/empty-state";
import { Skeleton, StatCardSkeleton, ChatSkeleton, SessionPlanSkeleton, DrillCardSkeleton } from "@/components/ui/skeleton";
import { Share2, Download, Settings2, Calendar, Trophy, Flame, Target, ArrowRight, Sparkles, Play, Video, Brain, Zap } from "lucide-react";
import { DISCIPLINES } from "@/lib/data";
import { toast } from "sonner";
import { handleSpotlightMove } from "@/hooks/use-spotlight";

interface ProgressData {
  stats: {
    totalXp: number;
    currentStreak: number;
    totalDrills: number;
    level: number;
    totalSessions?: number;
  };
  recentActivity?: { id: string; title: string; xp: number; completedAt: string }[];
  weeklyProgress?: {
    current: number;
    goal: number;
    percentage: number;
  };
}

interface RecentAnalysis {
  id: string;
  discipline: string;
  analysis_text: string;
  created_at: string;
  video_id?: string;
}

interface RecommendedDrill {
  id: string;
  title: string;
  category: string;
  xp_reward: number;
}

export default function Home() {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const parallaxBgRef = useRef<HTMLDivElement>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [recommendedDrills, setRecommendedDrills] = useState<RecommendedDrill[]>([]);
  const [lastDiscipline, setLastDiscipline] = useState<string>('football');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch progress
        const progressRes = await fetch('/api/progress?days=7');
        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgressData(data);
        }

        // Fetch recent analyses (we'll create a simple endpoint or use existing)
        const analysesRes = await fetch('/api/analyze-video?recent=true&limit=3');
        if (analysesRes.ok) {
          const data = await analysesRes.json();
          setRecentAnalyses(data.analyses || []);
          // Set last discipline from most recent analysis
          if (data.analyses?.length > 0) {
            setLastDiscipline(data.analyses[0].discipline || 'football');
          }
        }

        // Fetch recommended drills (random selection)
        const drillsRes = await fetch('/api/drills');
        if (drillsRes.ok) {
          const data = await drillsRes.json();
          // Shuffle and take 3
          const shuffled = (data.drills || []).sort(() => 0.5 - Math.random());
          setRecommendedDrills(shuffled.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
        if (mainScrollRef.current && parallaxBgRef.current) {
            const scrollTop = mainScrollRef.current.scrollTop;
            parallaxBgRef.current.style.transform = `translateY(${scrollTop * 0.3}px)`;
        }
    };

    const scrollContainer = mainScrollRef.current;
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
        if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleShare = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Dashboard link copied to clipboard!");
    } catch (err) {
        toast.error("Failed to copy link");
    }
  };

  const stats = progressData?.stats || { totalXp: 0, currentStreak: 0, totalDrills: 0, level: 1 };
  const lastDisciplineData = DISCIPLINES.find(d => d.slug === lastDiscipline) || DISCIPLINES[0];
  
  // Calculate weekly progress from API data (with fallback)
  const weeklyGoal = progressData?.weeklyProgress?.goal || 5;
  const weeklyProgress = progressData?.weeklyProgress?.current || 0;
  
  // Auto-rotate carousel (always active for dynamic Overview)
  useEffect(() => {
    if (isCarouselPaused) return;
    
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % DISCIPLINES.length);
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/landing');
    }
  }, [isLoaded, userId, router]);

  // Don't render dashboard if not authenticated (prevents flash during logout/redirect)
  if (!userId) {
    return null;
  }

  return (
    <main ref={mainScrollRef} id="main-scroll" className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
      {/* Parallax Background */}
      <div ref={parallaxBgRef} className="absolute top-0 left-0 w-full h-[1200px] pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-zinc-200/40 dark:from-zinc-900/40 to-transparent"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[500px] bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[400px] bg-blue-200/20 dark:bg-blue-900/5 rounded-full blur-[100px]"></div>
      </div>

      <Header />
      
      <div className="content-mask p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 z-10 relative">
        
        {isLoading ? (
          /* Loading Skeleton UI */
          <div className="space-y-6 animate-in fade-in">
            {/* Welcome skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            </div>
            
            {/* Main Grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                {/* Continue Training skeleton */}
                <Skeleton className="h-40 rounded-2xl" />
                
                {/* AI Analyses skeleton */}
                <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <Skeleton className="h-4 w-40 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                </div>
                
                {/* Drills skeleton */}
                <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <Skeleton className="h-4 w-36 mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <DrillCardSkeleton />
                    <DrillCardSkeleton />
                    <DrillCardSkeleton />
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-4 space-y-6">
                <ChatSkeleton />
                <SessionPlanSkeleton />
              </div>
            </div>
          </div>
        ) : (
        /* Actual Content */
        <>
        {/* Welcome + Compact Stats */}
        <ScrollReveal className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar size={12} /> 
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Welcome Back, {user?.firstName || 'Athlete'}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={handleShare} className="px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                <Share2 size={14} /> Share
              </button>
              <button onClick={() => router.push('/settings')} className="px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                <Settings2 size={14} /> Settings
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Level Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">Level</p>
                  <p className="text-2xl font-bold">{stats.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{stats.totalXp.toLocaleString()}</p>
                  <p className="text-[10px] text-white/70">XP</p>
                </div>
              </div>
            </div>
            
            {/* Streak Card */}
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="text-orange-500" size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Streak</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.currentStreak} <span className="text-xs font-normal text-zinc-500">days</span></p>
                </div>
              </div>
            </div>
            
            {/* Drills Card */}
            <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target className="text-emerald-500" size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Drills Done</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalDrills}</p>
                </div>
              </div>
            </div>
            
            {/* Weekly Goal Card */}
            <Link 
              href="/progress" 
              className="spotlight-card group bg-white dark:bg-zinc-900/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              onMouseMove={handleSpotlightMove}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="none" className="text-zinc-200 dark:text-zinc-700" />
                      <circle 
                        cx="20" cy="20" r="16" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeLinecap="round"
                        strokeDasharray={`${(weeklyProgress / weeklyGoal) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                        className="text-indigo-500 transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-900 dark:text-white">
                      {weeklyProgress}/{weeklyGoal}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">This Week</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">Sessions</p>
                  </div>
                </div>
                <ArrowRight className="text-zinc-400 group-hover:text-indigo-500 transition-colors" size={16} />
              </div>
            </Link>
          </div>
        </ScrollReveal>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Continue Training - Auto-rotating carousel */}
            <ScrollReveal delay={50}>
              <Link 
                href={`/disciplines/${DISCIPLINES[carouselIndex].slug}`}
                className="block group"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
              >
                <div className="spotlight-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 p-6 shadow-xl hover:shadow-2xl transition-all border border-zinc-200 dark:border-zinc-700" onMouseMove={handleSpotlightMove}>
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 dark:from-indigo-600/20 to-transparent" />
                  
                  {/* Content with fade transition */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Start Training
                      </p>
                      {/* Carousel dots */}
                      <div className="flex items-center gap-1.5">
                        {DISCIPLINES.map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIndex ? 'bg-indigo-500 dark:bg-indigo-400 w-3' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white transition-all">
                      {DISCIPLINES[carouselIndex].name}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 transition-all">
                      {DISCIPLINES[carouselIndex].description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                      <Play size={14} fill="currentColor" /> 
                      Start Training
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>

            {/* Recent AI Analyses */}
            <ScrollReveal delay={100}>
              <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Brain className="text-indigo-500" size={18} />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent AI Analyses</h3>
                  </div>
                  <Link href="/progress" className="text-xs text-indigo-500 hover:text-indigo-400">View All</Link>
                </div>
                
                <div className="space-y-3">
                  {recentAnalyses.length > 0 ? (
                    recentAnalyses.map((analysis, i) => (
                      <Link 
                        key={analysis.id || i} 
                        href={`/disciplines/${analysis.discipline || 'football'}?video=${analysis.video_id || ''}&analysis=${analysis.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                          <Video className="text-indigo-500" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900 dark:text-white capitalize">{analysis.discipline} Analysis</p>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
                            {analysis.analysis_text?.substring(0, 100)}...
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <ArrowRight className="text-zinc-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" size={14} />
                      </Link>
                    ))
                  ) : (
                    <NoAnalysesEmpty />
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Recommended Drills */}
            <ScrollReveal delay={150}>
              <div className="spotlight-card bg-white dark:bg-zinc-900/80 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800" onMouseMove={handleSpotlightMove}>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={18} />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recommended For You</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                  {recommendedDrills.map((drill, i) => (
                    <div key={drill.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">{drill.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{drill.category}</p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500 font-medium">
                        <Zap size={10} /> +{drill.xp_reward} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            {/* All Disciplines - Inside left column to avoid overlap */}
            <ScrollReveal delay={200} className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All Disciplines</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DISCIPLINES.map((d) => (
                  <Link key={d.slug} href={`/disciplines/${d.slug}`} className="block">
                    <div 
                      className={`spotlight-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all text-center ${d.active ? 'ring-2 ring-indigo-500' : ''}`}
                      onMouseMove={handleSpotlightMove}
                    >
                      <div className="relative z-10">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{d.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Suspense fallback={<ChatSkeleton />}>
              <AiChat />
            </Suspense>
            <Suspense fallback={<SessionPlanSkeleton />}>
              <SessionPlan />
            </Suspense>
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
