import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/sessions/items - Get items for current session
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ items: [], message: 'Database not configured' });
    }

    // Get internal Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ items: [] });
    }

    // Get current session
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userData.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return NextResponse.json({ items: [] });
    }

    // Fetch items
    const { data: items } = await supabase
      .from('session_items')
      .select('*')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ items: items || [] });

  } catch (error) {
    console.error('[SESSION_ITEMS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sessions/items - Add item to current session
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { label, xp_reward = 20 } = body;

    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    // Get internal Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current session
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userData.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 404 });
    }

    // Get current max sort_order
    const { data: lastItem } = await supabase
      .from('session_items')
      .select('sort_order')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastItem?.sort_order ?? -1) + 1;

    // Insert new item
    const { data: newItem, error } = await supabase
      .from('session_items')
      .insert({
        session_id: session.id,
        user_id: userData.id,
        label,
        checked: false,
        sort_order: sortOrder,
        xp_reward
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }

    return NextResponse.json({ item: newItem }, { status: 201 });

  } catch (error) {
    console.error('[SESSION_ITEMS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/sessions/items - Toggle item or update
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { id, checked } = body;

    if (!id || typeof checked !== 'boolean') {
      return NextResponse.json({ error: 'Item ID and checked status required' }, { status: 400 });
    }

    // Get internal Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the item first to know its XP reward
    const { data: existingItem } = await supabase
      .from('session_items')
      .select('*, sessions(id)')
      .eq('id', id)
      .eq('user_id', userData.id)
      .single();

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update item (ensuring ownership)
    const { data: updatedItem, error } = await supabase
      .from('session_items')
      .update({ checked })
      .eq('id', id)
      .eq('user_id', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    // If checking (completing) an item, record XP in user_progress and update stats
    if (checked && !existingItem.checked) {
      const xpReward = existingItem.xp_reward || 20;

      // Record in user_progress (for activity history)
      await supabase
        .from('user_progress')
        .insert({
          user_id: userData.id,
          session_id: existingItem.session_id,
          xp_earned: xpReward,
          completed_at: new Date().toISOString()
        });

      // Update user_stats (upsert to create if not exists)
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (currentStats) {
        await supabase
          .from('user_stats')
          .update({
            total_xp: (currentStats.total_xp || 0) + xpReward,
            total_drills_completed: (currentStats.total_drills_completed || 0) + 1
          })
          .eq('user_id', userData.id);
      } else {
        await supabase
          .from('user_stats')
          .insert({
            user_id: userData.id,
            total_xp: xpReward,
            total_drills_completed: 1,
            total_sessions: 1
          });
      }
    }

    // If unchecking, we could optionally subtract XP (for now, we don't to prevent gaming)

    return NextResponse.json({ item: updatedItem });

  } catch (error) {
    console.error('[SESSION_ITEMS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/sessions/items - Remove item
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Get internal Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete item (ensuring ownership)
    const { error } = await supabase
      .from('session_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[SESSION_ITEMS_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
