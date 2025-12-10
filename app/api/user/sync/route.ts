import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST /api/user/sync - Sync Clerk user to Supabase
export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database not configured, using mock data' 
      });
    }

    console.log('USER SYNC: Starting for clerk_id:', userId);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    console.log('USER SYNC: Check result:', { existingUser, checkError: checkError?.message });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let dbUserId: string;

    if (!existingUser) {
      console.log('USER SYNC: Creating new user...');
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || user.firstName || 'Athlete',
          avatar_url: user.imageUrl || null,
        })
        .select('id')
        .single();

      console.log('USER SYNC: Insert result:', { newUser, insertError: insertError?.message });

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      dbUserId = newUser.id;

      // Create initial user_stats record
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: dbUserId,
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
        console.error('Error creating user stats:', statsError);
      }

      // Create initial user_settings record
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: dbUserId,
          theme: 'dark',
          notifications_enabled: true,
          email_notifications: true,
          weekly_report: true,
          preferred_discipline: 'football',
          weekly_sessions_goal: 5,
          onboarding_completed: false, // Explicitly set to trigger wizard
        });

      if (settingsError) {
        console.error('Error creating user settings:', settingsError);
      }

      return NextResponse.json({ 
        success: true, 
        isNew: true,
        message: 'User created successfully' 
      });
    } else {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || user.firstName || 'Athlete',
          avatar_url: user.imageUrl || null,
        })
        .eq('clerk_id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
      }

      return NextResponse.json({ 
        success: true, 
        isNew: false,
        message: 'User synced successfully' 
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
