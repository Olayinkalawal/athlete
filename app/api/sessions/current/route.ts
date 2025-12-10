import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SESSION_ITEMS } from '@/lib/data';

// GET /api/sessions/current - Get or create the current active session
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      // Return mock data when database is not configured
      return NextResponse.json({ 
        session: null,
        items: SESSION_ITEMS,
        message: 'Database not configured. Using local storage.'
      });
    }

    // Get internal Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        session: null,
        items: SESSION_ITEMS,
        message: 'User not synced. Using local storage.'
      });
    }

    // Find current in_progress session
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      // Fetch items for this session
      const { data: items } = await supabase
        .from('session_items')
        .select('*')
        .eq('session_id', existingSession.id)
        .order('sort_order', { ascending: true });

      return NextResponse.json({ 
        session: existingSession, 
        items: items || [] 
      });
    }

    // No active session - create one with default items
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userData.id,
        title: 'Training Session',
        status: 'in_progress'
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ 
        session: null,
        items: SESSION_ITEMS,
        message: 'Failed to create session.'
      });
    }

    // Create default session items
    const defaultItems = SESSION_ITEMS.map((item, index) => ({
      session_id: newSession.id,
      user_id: userData.id,
      label: item.label,
      checked: false,
      sort_order: index,
      xp_reward: item.label.toLowerCase().includes('warm') ? 10 : 
                 item.label.toLowerCase().includes('penalty') ? 30 : 20
    }));

    const { data: createdItems } = await supabase
      .from('session_items')
      .insert(defaultItems)
      .select();

    return NextResponse.json({ 
      session: newSession, 
      items: createdItems || [] 
    });

  } catch (error) {
    console.error('[SESSIONS_CURRENT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sessions/current - Create a new session (closes current one)
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

    const body = await request.json().catch(() => ({}));
    const { title, items } = body;

    // Get internal Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark current session as completed
    await supabase
      .from('sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('user_id', userData.id)
      .eq('status', 'in_progress');

    // Create new session
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userData.id,
        title: title || 'Training Session',
        status: 'in_progress'
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Create session items (use provided items or defaults)
    const itemsToCreate = (items || SESSION_ITEMS).map((item: any, index: number) => ({
      session_id: newSession.id,
      user_id: userData.id,
      label: typeof item === 'string' ? item : item.label,
      checked: false,
      sort_order: index,
      xp_reward: (typeof item === 'string' ? item : item.label).toLowerCase().includes('warm') ? 10 : 
                 (typeof item === 'string' ? item : item.label).toLowerCase().includes('penalty') ? 30 : 20
    }));

    const { data: createdItems } = await supabase
      .from('session_items')
      .insert(itemsToCreate)
      .select();

    return NextResponse.json({ 
      session: newSession, 
      items: createdItems || [] 
    }, { status: 201 });

  } catch (error) {
    console.error('[SESSIONS_CURRENT_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
