import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/settings - Get user's settings
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        settings: {
          theme: 'dark',
          notifications_enabled: true,
          email_notifications: true,
          weekly_report: true,
          preferred_discipline: 'football',
          weekly_sessions_goal: 5,
          onboarding_completed: false
        },
        message: 'Database not configured - using defaults'
      });
    }

    // Get internal user ID from clerk_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      // User doesn't exist yet, return defaults
      return NextResponse.json({
        settings: {
          theme: 'dark',
          notifications_enabled: true,
          email_notifications: true,
          weekly_report: true,
          preferred_discipline: 'football',
          weekly_sessions_goal: 5,
          onboarding_completed: false
        }
      });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('SETTINGS GET: user_id:', user.id, 'data:', data, 'error:', error?.message);

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return default settings if none exist
    const settings = data || {
      theme: 'dark',
      notifications_enabled: true,
      email_notifications: true,
      weekly_report: true,
      preferred_discipline: 'football',
      weekly_sessions_goal: 5,
      onboarding_completed: false
    };
    
    console.log('SETTINGS GET: Returning onboarding_completed:', settings.onboarding_completed);
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings - Update user's settings
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme, notifications_enabled, email_notifications, weekly_report, preferred_discipline, weekly_sessions_goal, onboarding_completed } = body;

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get internal user ID from clerk_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert settings (insert if not exists, update if exists)
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        theme: theme || 'dark',
        notifications_enabled: notifications_enabled ?? true,
        email_notifications: email_notifications ?? true,
        weekly_report: weekly_report ?? true,
        preferred_discipline: preferred_discipline || 'football',
        weekly_sessions_goal: weekly_sessions_goal ?? 5,
        onboarding_completed: onboarding_completed ?? false
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Settings upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
