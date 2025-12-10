import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        
        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        const body = await req.json();
        const { title, url, size, duration, discipline = 'football' } = body;

        // 1. Get internal Supabase ID from Clerk ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (userError || !userData) {
            console.error("User sync error:", userError);
            return new NextResponse("User not synced to database", { status: 404 });
        }

        // 2. Insert Video Record with discipline
        const { data: videoData, error: videoError } = await supabase
            .from('user_videos')
            .insert({
                user_id: userData.id,
                title: title || 'Untitled Video',
                url: url,
                size_bytes: size,
                duration_seconds: duration || 0,
                discipline: discipline
            })
            .select()
            .single();

        if (videoError) {
            console.error("Video insert error:", videoError);
            return new NextResponse("Failed to save video metadata", { status: 500 });
        }

        return NextResponse.json(videoData);

    } catch (error) {
        console.error("[VIDEOS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get query params
        const { searchParams } = new URL(req.url);
        const discipline = searchParams.get('discipline') || 'football';
        const fetchAll = searchParams.get('all') === 'true';

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        // 1. Get internal Supabase ID
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
             return new NextResponse("User not found", { status: 404 });
        }

        // 2. Fetch videos
        let query = supabase
            .from('user_videos')
            .select('*')
            .eq('user_id', userData.id)
            .eq('discipline', discipline)
            .order('created_at', { ascending: false });

        if (fetchAll) {
            // Return all videos for this discipline
            const { data: videos, error } = await query.limit(20);
            
            if (error) {
                return NextResponse.json({ videos: [] });
            }
            
            return NextResponse.json({ videos: videos || [] });
        } else {
            // Return just the latest video
            const { data: videoData, error } = await query.limit(1).single();

            if (error) {
                 // It's okay if no video exists for this discipline
                 return NextResponse.json({ video: null });
            }

            return NextResponse.json({ video: videoData });
        }

    } catch (error) {
        console.error("[VIDEOS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const videoId = searchParams.get('id');

        if (!videoId) {
            return new NextResponse("Video ID required", { status: 400 });
        }

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return new NextResponse("Database Configuration Missing", { status: 500 });
        }

        // 1. Get internal Supabase ID
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. Get the video to verify ownership and get URL for storage deletion
        const { data: video, error: fetchError } = await supabase
            .from('user_videos')
            .select('*')
            .eq('id', videoId)
            .eq('user_id', userData.id)
            .single();

        if (fetchError || !video) {
            return new NextResponse("Video not found or not authorized", { status: 404 });
        }

        // 3. Delete from storage (extract path from URL)
        try {
            const url = new URL(video.url);
            const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/training-videos\/(.+)/);
            if (pathMatch && pathMatch[1]) {
                const storagePath = decodeURIComponent(pathMatch[1]);
                await supabase.storage.from('training-videos').remove([storagePath]);
            }
        } catch (storageError) {
            console.error("Storage deletion error (continuing):", storageError);
            // Continue even if storage deletion fails
        }

        // 4. Delete associated analyses
        await supabase
            .from('video_analyses')
            .delete()
            .eq('video_id', videoId);

        // 5. Delete video record from database
        const { error: deleteError } = await supabase
            .from('user_videos')
            .delete()
            .eq('id', videoId)
            .eq('user_id', userData.id);

        if (deleteError) {
            console.error("Video delete error:", deleteError);
            return new NextResponse("Failed to delete video", { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Video deleted" });

    } catch (error) {
        console.error("[VIDEOS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
