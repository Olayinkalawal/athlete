import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/debug/user - Check if user exists in Supabase
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client creation failed',
        userId,
        clerkAuthenticated: true,
      }, { status: 500 });
    }

    // Check if user exists in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email, name')
      .eq('clerk_id', userId)
      .single();

    // Check user_stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    // Check user_settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    return NextResponse.json({
      clerkUserId: userId,
      clerkAuthenticated: true,
      database: {
        user: {
          exists: !!user,
          data: user,
          error: userError?.message || null,
        },
        stats: {
          exists: !!stats,
          error: statsError?.message || null,
        },
        settings: {
          exists: !!settings,
          error: settingsError?.message || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
