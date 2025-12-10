import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// GET /api/debug/env - Check environment configuration (safe endpoint)
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Don't expose actual values, just check if they exist
    const envCheck = {
      clerk: {
        publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: !!process.env.CLERK_SECRET_KEY,
      },
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      openai: {
        apiKey: !!process.env.OPENAI_API_KEY,
      },
      userId: userId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(envCheck);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
