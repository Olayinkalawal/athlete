import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        // Get internal Supabase user ID
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
            return NextResponse.json({
                dailyXp: [],
                recentActivity: [],
                stats: { totalXp: 0, currentStreak: 0, longestStreak: 0, totalDrills: 0, totalMinutes: 0 }
            });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get daily XP data (aggregated by day)
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('completed_at, xp_earned, drill_id, drills(title)')
            .eq('user_id', userData.id)
            .gte('completed_at', startDate.toISOString())
            .order('completed_at', { ascending: false });

        // Aggregate XP by day
        const dailyXpMap: Record<string, number> = {};
        const dateLabels: string[] = [];
        
        // Initialize all days in range
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateKey = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyXpMap[dateKey] = 0;
            dateLabels.push(label);
        }

        // Fill in actual XP values
        progressData?.forEach(p => {
            const dateKey = new Date(p.completed_at).toISOString().split('T')[0];
            if (dailyXpMap.hasOwnProperty(dateKey)) {
                dailyXpMap[dateKey] += p.xp_earned || 0;
            }
        });

        // Convert to array format for charts
        const dailyXp = Object.entries(dailyXpMap).map(([date, xp], index) => ({
            date: dateLabels[index] || date,
            xp
        }));

        // Get recent activity (last 10)
        const recentActivity = progressData?.slice(0, 10).map(p => ({
            id: p.drill_id,
            title: (p.drills as any)?.title || 'Unknown Drill',
            xp: p.xp_earned,
            completedAt: p.completed_at
        })) || [];

        // Get user stats
        const { data: statsData } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userData.id)
            .single();

        // Get user settings for weekly goal
        const { data: settingsData } = await supabase
            .from('user_settings')
            .select('weekly_sessions_goal')
            .eq('user_id', userData.id)
            .single();

        // Calculate weekly sessions (sessions completed this week)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        const { data: weeklySessionsData, count: weeklySessionsCount } = await supabase
            .from('sessions')
            .select('id', { count: 'exact' })
            .eq('user_id', userData.id)
            .gte('created_at', startOfWeek.toISOString());

        const stats = {
            totalXp: statsData?.total_xp || 0,
            currentStreak: statsData?.current_streak || 0,
            longestStreak: statsData?.longest_streak || 0,
            totalDrills: statsData?.total_drills_completed || 0,
            totalMinutes: statsData?.total_training_minutes || 0,
            avgAccuracy: statsData?.avg_accuracy || 0,
            totalSessions: statsData?.total_sessions || 0
        };

        // Calculate level from XP (100 XP per level)
        const level = Math.floor(stats.totalXp / 100) + 1;
        const xpToNextLevel = 100 - (stats.totalXp % 100);

        // Weekly goal tracking
        const weeklyGoal = settingsData?.weekly_sessions_goal || 5;
        const weeklySessions = weeklySessionsCount || 0;

        return NextResponse.json({
            dailyXp,
            recentActivity,
            stats: {
                ...stats,
                level,
                xpToNextLevel
            },
            weeklyProgress: {
                current: weeklySessions,
                goal: weeklyGoal,
                percentage: Math.min(100, Math.round((weeklySessions / weeklyGoal) * 100))
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });

    } catch (error) {
        console.error("[PROGRESS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
