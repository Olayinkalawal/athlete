import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST - Mark a drill as completed and award XP
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { drillId, timeSpentSeconds = 0 } = body;

        if (!drillId) {
            return new NextResponse("Drill ID required", { status: 400 });
        }

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        // 1. Get internal Supabase user ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (userError || !userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. Get drill info for XP reward (backward compatible with missing columns)
        const { data: drill, error: drillError } = await supabase
            .from('drills')
            .select('id, xp_reward, title, is_custom, created_by')
            .eq('id', drillId)
            .single();

        if (drillError || !drill) {
            console.error('[DRILL_COMPLETE] Drill fetch error:', drillError);
            return new NextResponse("Drill not found", { status: 404 });
        }

        // 3. Record the completion in user_progress
        // Record the completion
        const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .insert({
                user_id: userData.id,
                drill_id: drillId,
                time_spent_seconds: timeSpentSeconds,
                xp_earned: drill.xp_reward,
                score: 100, // Default full score for completion
                completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (progressError) {
            console.error('[DRILL_COMPLETE] Progress error:', progressError);
            return new NextResponse('Failed to record progress', { status: 500 });
        }

        // 4. Update user_stats (increment totals)
        // First, get existing stats to ensure correct upsert
        const { data: existingStats, error: fetchStatsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userData.id)
            .single();

        if (fetchStatsError && fetchStatsError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('[DRILL_COMPLETE] Error fetching existing stats:', fetchStatsError);
            // Don't fail the request, proceed with upsert assuming no existing stats
        }

        const { error: statsError } = await supabase
            .from('user_stats')
            .upsert({
                user_id: userData.id,
                total_drills_completed: (existingStats?.total_drills_completed || 0) + 1,
                total_xp: (existingStats?.total_xp || 0) + (drill.xp_reward || 0),
                total_training_minutes: (existingStats?.total_training_minutes || 0) + Math.ceil(timeSpentSeconds / 60),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (statsError) {
            console.error('[DRILL_COMPLETE] Stats error:', statsError);
        }

        // AUTO-DELETE CUSTOM DRILLS AFTER COMPLETION
        // Custom drills are personalized for specific weaknesses, once done they're no longer needed
        if (drill.is_custom) {
            const { error: deleteError } = await supabase
                .from('drills')
                .delete()
                .eq('id', drillId)
                .eq('created_by', userId); // Safety: only delete if user owns it

            if (deleteError) {
                console.error('[DRILL_COMPLETE] Failed to delete custom drill:', deleteError);
                // Don't fail the request, drill was still completed
            } else {
                console.log(`[DRILL_COMPLETE] Auto-deleted custom drill: ${drill.title}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Completed "${drill.title}"`,
            xpEarned: drill.xp_reward,
            completionId: progressData.id,
            customDrillDeleted: drill.is_custom || false
        });

    } catch (error) {
        console.error("[DRILLS_COMPLETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET - Check if user has completed a drill (today or ever)
export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const drillId = searchParams.get('drillId');

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        // Get user ID
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Get all drill completions for this user
        let query = supabase
            .from('user_progress')
            .select('drill_id, completed_at, xp_earned')
            .eq('user_id', userData.id)
            .order('completed_at', { ascending: false });

        if (drillId) {
            query = query.eq('drill_id', drillId);
        }

        const { data: completions, error } = await query;

        if (error) {
            console.error("Completions fetch error:", error);
            return new NextResponse("Failed to fetch completions", { status: 500 });
        }

        // Create a map of drill_id -> completion info
        const completionMap: Record<string, { lastCompleted: string; count: number }> = {};
        
        completions?.forEach(c => {
            if (!completionMap[c.drill_id]) {
                completionMap[c.drill_id] = {
                    lastCompleted: c.completed_at,
                    count: 1
                };
            } else {
                completionMap[c.drill_id].count++;
            }
        });

        return NextResponse.json({ completions: completionMap });

    } catch (error) {
        console.error("[DRILLS_COMPLETE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
