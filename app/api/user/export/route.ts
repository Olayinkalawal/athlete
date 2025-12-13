import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/user/export - Export all user data as JSON
export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
        }

        // Get internal user ID from clerk_id
        const { data: dbUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_id', userId)
            .single();

        if (userError || !dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const internalUserId = dbUser.id;

        // Fetch all user data in parallel
        const [
            { data: userSettings },
            { data: userStats },
            { data: trainingSessions },
            { data: drills }
        ] = await Promise.all([
            supabase.from('user_settings').select('*').eq('user_id', internalUserId).single(),
            supabase.from('user_stats').select('*').eq('user_id', internalUserId).single(),
            supabase.from('training_sessions').select('*').eq('user_id', internalUserId).order('created_at', { ascending: false }),
            supabase.from('drills').select('*, training_sessions!inner(user_id)').eq('training_sessions.user_id', internalUserId)
        ]);

        // Compile export data
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                email: user.emailAddresses[0]?.emailAddress || dbUser.email,
                name: user.fullName || dbUser.name,
                createdAt: dbUser.created_at,
            },
            settings: userSettings ? {
                theme: userSettings.theme,
                notifications_enabled: userSettings.notifications_enabled,
                email_notifications: userSettings.email_notifications,
                weekly_report: userSettings.weekly_report,
                preferred_discipline: userSettings.preferred_discipline,
                weekly_sessions_goal: userSettings.weekly_sessions_goal,
            } : null,
            stats: userStats ? {
                total_sessions: userStats.total_sessions,
                total_drills_completed: userStats.total_drills_completed,
                total_calories_burned: userStats.total_calories_burned,
                total_training_minutes: userStats.total_training_minutes,
                total_xp: userStats.total_xp,
                avg_accuracy: userStats.avg_accuracy,
                current_streak: userStats.current_streak,
                longest_streak: userStats.longest_streak,
            } : null,
            trainingSessions: trainingSessions?.map(session => ({
                id: session.id,
                title: session.title,
                discipline: session.discipline,
                duration_minutes: session.duration_minutes,
                calories_burned: session.calories_burned,
                xp_earned: session.xp_earned,
                drills_completed: session.drills_completed,
                accuracy_score: session.accuracy_score,
                notes: session.notes,
                created_at: session.created_at,
            })) || [],
            drills: drills?.map(drill => ({
                id: drill.id,
                name: drill.name,
                category: drill.category,
                difficulty: drill.difficulty,
                duration_seconds: drill.duration_seconds,
                reps: drill.reps,
                sets: drill.sets,
                completed: drill.completed,
                performance_rating: drill.performance_rating,
                notes: drill.notes,
                created_at: drill.created_at,
            })) || [],
        };

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="athlete-data-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
