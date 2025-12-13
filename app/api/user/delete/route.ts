import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// DELETE /api/user/delete - Permanently delete user account and all data
export async function DELETE(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify confirmation
        const body = await request.json();
        if (body.confirmation !== 'DELETE') {
            return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
        }

        // Get internal user ID from clerk_id
        const { data: dbUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error finding user:', userError);
            return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
        }

        // Delete all user data from Supabase if user exists
        if (dbUser) {
            const internalUserId = dbUser.id;

            // Get all training session IDs for this user
            const { data: sessions } = await supabase
                .from('training_sessions')
                .select('id')
                .eq('user_id', internalUserId);

            // Delete drills for all user's sessions
            if (sessions && sessions.length > 0) {
                const sessionIds = sessions.map(s => s.id);
                const { error: drillsError } = await supabase
                    .from('drills')
                    .delete()
                    .in('session_id', sessionIds);

                if (drillsError) {
                    console.error('Error deleting drills:', drillsError);
                }
            }

            // Delete training sessions
            const { error: sessionsError } = await supabase
                .from('training_sessions')
                .delete()
                .eq('user_id', internalUserId);

            if (sessionsError) {
                console.error('Error deleting sessions:', sessionsError);
            }

            // Delete user stats
            const { error: statsError } = await supabase
                .from('user_stats')
                .delete()
                .eq('user_id', internalUserId);

            if (statsError) {
                console.error('Error deleting stats:', statsError);
            }

            // Delete user settings
            const { error: settingsError } = await supabase
                .from('user_settings')
                .delete()
                .eq('user_id', internalUserId);

            if (settingsError) {
                console.error('Error deleting settings:', settingsError);
            }

            // Delete user record
            const { error: userDeleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', internalUserId);

            if (userDeleteError) {
                console.error('Error deleting user record:', userDeleteError);
            }
        }

        // Delete user from Clerk
        try {
            const client = await clerkClient();
            await client.users.deleteUser(userId);
        } catch (clerkError) {
            console.error('Error deleting Clerk user:', clerkError);
            // Continue anyway - Supabase data is already deleted
        }

        return NextResponse.json({
            success: true,
            message: 'Account permanently deleted'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
