import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import OpenAI from 'openai';

// Lazy initialization
let openaiClient: OpenAI | null = null;
function getOpenAI() {
    if (!openaiClient && process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

interface DayPlan {
    day: number;
    name: string;
    focus: string;
    drills: { title: string; duration: number; xp: number; notes: string }[];
    restDay: boolean;
    totalMinutes: number;
    totalXp: number;
}

interface WeeklyPlan {
    weekStart: string;
    discipline: string;
    days: DayPlan[];
    generatedAt: string;
}

// GET - Fetch current week's plan
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ plan: null, message: 'Database not configured' });
        }

        // Get internal user ID
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
            return NextResponse.json({ plan: null });
        }

        // Get current week start (Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.toISOString().split('T')[0];

        // Fetch plan for this week
        const { data: plan } = await supabase
            .from('training_plans')
            .select('*')
            .eq('user_id', userData.id)
            .eq('week_start', weekStart)
            .single();

        return NextResponse.json({ plan: plan?.plan_data || null, weekStart });

    } catch (error) {
        console.error('[TRAINING_PLAN_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Generate new weekly plan
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const openai = getOpenAI();
        if (!openai) {
            return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
        }

        const supabase = createServerSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
        }

        // Get user data
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get user settings
        const { data: settings } = await supabase
            .from('user_settings')
            .select('preferred_discipline, weekly_sessions_goal')
            .eq('user_id', userData.id)
            .single();

        const discipline = settings?.preferred_discipline || 'football';
        const weeklyGoal = settings?.weekly_sessions_goal || 5;

        // Get user stats for context
        const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userData.id)
            .single();

        // Build prompt
        const prompt = `You are an elite ${discipline} coach creating a personalized 7-day training plan.

ATHLETE PROFILE:
- Sport: ${discipline}
- Weekly session goal: ${weeklyGoal} sessions
- Total sessions completed: ${stats?.total_sessions || 0}
- Current streak: ${stats?.current_streak || 0} days
- Total XP: ${stats?.total_xp || 0}
- Experience level: ${stats?.total_sessions > 20 ? 'Intermediate' : 'Beginner'}

Create a balanced 7-day training plan with:
- ${weeklyGoal} training days and ${7 - weeklyGoal} rest days
- Each training day has 2-4 specific drills
- Include variety: technique, conditioning, strength, recovery
- Progressive difficulty through the week
- Rest days on weekends unless goal is 6-7 days

For each drill provide:
- title: Specific, actionable name
- duration: 10-30 minutes
- xp: 15-40 based on intensity
- notes: One sentence coaching tip

Return as JSON with this structure:
{
  "days": [
    {
      "day": 1,
      "name": "Monday",
      "focus": "Technique & Fundamentals",
      "restDay": false,
      "drills": [
        { "title": "...", "duration": 15, "xp": 20, "notes": "..." }
      ],
      "totalMinutes": 45,
      "totalXp": 60
    }
  ]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert sports coach. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        // Parse response
        const parsed = JSON.parse(content);

        // Get week start
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.toISOString().split('T')[0];

        const plan: WeeklyPlan = {
            weekStart,
            discipline,
            days: parsed.days,
            generatedAt: new Date().toISOString()
        };

        // Save to database (upsert)
        const { error: saveError } = await supabase
            .from('training_plans')
            .upsert({
                user_id: userData.id,
                discipline,
                week_start: weekStart,
                plan_data: plan
            }, {
                onConflict: 'user_id,week_start'
            });

        if (saveError) {
            console.error('Failed to save plan:', saveError);
            // Still return the plan even if save fails
        }

        return NextResponse.json({ plan, saved: !saveError });

    } catch (error: any) {
        console.error('[TRAINING_PLAN_POST]', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate plan' },
            { status: 500 }
        );
    }
}
