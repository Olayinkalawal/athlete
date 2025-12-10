import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/debug/force-sync - Force create user in Supabase with detailed logging
export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing env vars',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing',
      }, { status: 500 });
    }

    // Create client directly to bypass any caching issues
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const logs = [];

    // Step 1: Check if user exists
    logs.push('Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    logs.push(`Check result: ${existingUser ? 'User exists' : 'User not found'}`);
    if (checkError) logs.push(`Check error: ${checkError.message}`);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser,
        logs,
      });
    }

    // Step 2: Create user
    logs.push('Creating new user...');
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || 'Athlete',
        avatar_url: user.imageUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      logs.push(`Insert error: ${insertError.message}`);
      return NextResponse.json({
        error: 'Failed to create user',
        details: insertError,
        logs,
      }, { status: 500 });
    }

    logs.push(`User created with ID: ${newUser.id}`);

    // Step 3: Create user_stats
    logs.push('Creating user_stats...');
    const { error: statsError } = await supabase
      .from('user_stats')
      .insert({
        user_id: newUser.id,
        total_sessions: 0,
        total_drills_completed: 0,
        total_calories_burned: 0,
        total_training_minutes: 0,
        total_xp: 0,
        avg_accuracy: 0,
        current_streak: 0,
        longest_streak: 0,
      });

    if (statsError) {
      logs.push(`Stats error: ${statsError.message}`);
    } else {
      logs.push('Stats created successfully');
    }

    // Step 4: Create user_settings
    logs.push('Creating user_settings...');
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        theme: 'dark',
        notifications_enabled: true,
        email_notifications: true,
        weekly_report: true,
        preferred_discipline: 'football',
        weekly_sessions_goal: 5,
        onboarding_completed: false,
      });

    if (settingsError) {
      logs.push(`Settings error: ${settingsError.message}`);
    } else {
      logs.push('Settings created successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully!',
      user: newUser,
      logs,
      nextSteps: 'Reload the home page to see your dashboard',
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
