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

interface GeneratedDrill {
  title: string;
  description: string;
  duration_minutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  target_weakness: string;
  instructions: string[];
  why_it_helps: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { analysisText, poseDataSummary, discipline = 'football' } = body;

    if (!analysisText) {
      return NextResponse.json({ 
        error: 'Analysis text required' 
      }, { status: 400 });
    }

    // Build the GPT prompt
    const prompt = `You are an elite ${discipline} coach creating personalized training drills.

ATHLETE'S ANALYSIS RESULTS:
${analysisText}

${poseDataSummary ? `TECHNICAL DATA:\n${poseDataSummary}\n` : ''}

Based on this analysis, create 3-4 targeted drills that address the specific weaknesses identified. 

For each drill, provide:
1. **title**: Motivating, action-oriented name (e.g., "Hip Explosion Series")
2. **description**: One sentence summary
3. **duration_minutes**: 5-15 minutes
4. **difficulty**: "Beginner", "Intermediate", or "Advanced"
5. **target_weakness**: Which specific weakness this addresses (extract from analysis)
6. **why_it_helps**: 1-2 sentences explaining the connection to their weakness
7. **instructions**: Array of 4-6 clear, numbered steps

Use ${discipline} terminology. Be specific and actionable.

Return as a JSON object with a "drills" array containing the drill objects.`;

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ 
        error: 'OpenAI not available' 
      }, { status: 503 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert sports coach who creates effective, personalized training drills. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the response
    let drills: GeneratedDrill[];
    try {
      const parsed = JSON.parse(content);
      drills = Array.isArray(parsed) ? parsed : parsed.drills || [];
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    if (!drills || drills.length === 0) {
      throw new Error('No drills generated');
    }

    // Save drills to database
    const supabase = createServerSupabaseClient();
    
    // CRITICAL: Get discipline UUID from slug (drills table uses discipline_id FK)
    const { data: disciplineData, error: disciplineError } = await supabase
      .from('disciplines')
      .select('id')
      .eq('slug', discipline)
      .single();
    
    if (disciplineError || !disciplineData) {
      console.error('Failed to find discipline:', disciplineError);
      return NextResponse.json({
        drills,
        saved: 0,
        count: drills.length,
        error: 'Discipline not found'
      });
    }
    
    const drillsToInsert = drills.map(drill => ({
      discipline_id: disciplineData.id, // Use UUID foreign key
      title: drill.title,
      description: drill.description,
      duration_minutes: drill.duration_minutes,
      difficulty: drill.difficulty.toLowerCase(),
      category: 'Custom', // Mark category as Custom
      xp_reward: drill.duration_minutes * 10, // 10 XP per minute
      is_custom: true, // Mark as AI-generated custom drill
      created_by: userId,
      instructions: drill.instructions,
      metadata: {
        target_weakness: drill.target_weakness,
        why_it_helps: drill.why_it_helps,
        generated_from_analysis: true
      }
    }));

    const { data: savedDrills, error: insertError } = await supabase
      .from('drills')
      .insert(drillsToInsert)
      .select();

    if (insertError) {
      console.error('Failed to save drills:', insertError);
      return NextResponse.json({
        drills,
        saved: 0,
        count: drills.length,
        error: insertError.message
      });
    }

    return NextResponse.json({
      drills,
      saved: savedDrills?.length || 0,
      count: drills.length
    });

  } catch (error: any) {
    console.error('Drill generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate drills' },
      { status: 500 }
    );
  }
}
