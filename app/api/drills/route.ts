import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET - Fetch drills (optionally filtered by discipline)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const discipline = searchParams.get('discipline');

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        let query = supabase
            .from('drills')
            .select(`
                id,
                title,
                description,
                category,
                duration_minutes,
                difficulty,
                xp_reward,
                image_url,
                discipline_id,
                is_custom,
                created_by,
                disciplines!inner(slug, name)
            `)
            .eq('is_custom', true) // ONLY custom drills
            .not('is_custom', 'is', null) // Exclude NULL values (generic drills)
            .order('created_at', { ascending: false });

        // Filter by discipline if provided
        if (discipline) {
            query = query.eq('disciplines.slug', discipline);
        }

        const { data: drills, error } = await query;

        if (error) {
            console.error("[DRILLS_GET] Error:", error);
            return new NextResponse("Failed to fetch drills", { status: 500 });
        }

        return NextResponse.json({ drills: drills || [] }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
            }
        });

    } catch (error) {
        console.error("[DRILLS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
