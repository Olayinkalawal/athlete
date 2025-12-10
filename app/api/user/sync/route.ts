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

    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    console.log('USER SYNC: Starting for clerk_id:', userId, 'email:', userEmail);

    // STEP 1: Check if user exists by Clerk ID
    let { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, clerk_id, email, name, avatar_url')
      .eq('clerk_id', userId)
      .single();

    console.log('USER SYNC: Check by clerk_id:', { existingUser, error: checkError?.message });

    // STEP 2: If not found by Clerk ID, try finding by email
    // This handles the case where user was created in a different environment (localhost vs production)
    if (checkError && checkError.code === 'PGRST116' && userEmail) {
      console.log('USER SYNC: User not found by clerk_id, trying email...');
      const { data: emailMatch, error: emailError } = await supabase
        .from('users')
        .select('id, clerk_id, email, name, avatar_url')
        .eq('email', userEmail)
        .single();

      if (emailMatch && !emailError) {
        console.log('USER SYNC: Found existing user by email, updating clerk_id...');
        // Update the existing user's Clerk ID
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update({ 
            clerk_id: userId,
            name: user.fullName || user.firstName || emailMatch.name || 'Athlete',
            avatar_url: user.imageUrl || emailMatch.avatar_url,
          })
          .eq('id', emailMatch.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user clerk_id:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        existingUser = updated;
        console.log('USER SYNC: Successfully updated clerk_id for existing user');
      }
    }

    // Handle other database errors
    if (checkError && checkError.code !== 'PGRST116' && !existingUser) {
      console.error('Error checking user:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let dbUserId: string;

    // STEP 3: Create new user if still not found
    if (!existingUser) {
      console.log('USER SYNC: Creating new user...');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: userEmail,
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
          onboarding_completed: false, // Trigger onboarding for new users
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
      // STEP 4: Update existing user info (keep data fresh)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: userEmail,
          name: user.fullName || user.firstName || existingUser.name || 'Athlete',
          avatar_url: user.imageUrl || existingUser.avatar_url,
        })
        .eq('clerk_id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
      }

      console.log('USER SYNC: Returning user, clerk_id already matched');
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
