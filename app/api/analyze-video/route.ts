import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import OpenAI from 'openai';

// Lazy initialization to prevent build failures when key is not set
let openaiClient: OpenAI | null = null;
function getOpenAI() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Sport-specific analysis prompts
const ANALYSIS_PROMPTS: Record<string, string> = {
  football: `You are an elite football (soccer) coach giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering body positioning, ball control, and movement quality. End with 2-3 specific tips to improve.`,

  basketball: `You are an elite basketball coach giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering shooting form, footwork, and ball handling. End with 2-3 specific tips to improve.`,

  boxing: `You are an elite boxing coach giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering stance & guard, punching technique, and head movement. End with 2-3 specific tips to improve.`,

  mma: `You are an elite MMA coach giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering fighting stance, striking technique, and grappling readiness. End with 2-3 specific tips to improve.`,

  taekwondo: `You are an elite Taekwondo master giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering kicking form, stance & balance, and flexibility. End with 2-3 specific tips to improve.`,

  'american-football': `You are an elite American football coach giving direct feedback after watching training footage.
Analyze the frames and give conversational coaching feedback covering athletic stance, footwork, and technique. End with 2-3 specific tips to improve.`
};

const DEFAULT_PROMPT = `You are an elite sports coach analyzing training footage. This could be solo training, training with equipment, or team training.

Analyze the technique, movement quality, form, and effort. Look for:
• Proper technique execution
• Body positioning and balance
• Movement patterns and quality
• Work rate and intensity
• Areas for improvement

Give conversational coaching feedback using proper sport terminology. End with 2-3 specific actionable tips to improve performance.`;

function getAnalysisPrompt(discipline: string, hasPoseData: boolean = false): string {
  const basePrompt = ANALYSIS_PROMPTS[discipline] || DEFAULT_PROMPT;

  // Add skeleton awareness if pose data is present
  const skeletonContext = hasPoseData ? `
CRITICAL - POSE SKELETON OVERLAY VISIBLE:
The images contain a GREEN SKELETON overlay with PINK JOINT DOTS drawn on the athlete. You MUST:
1. START your analysis by mentioning what you observe in the skeleton positioning
2. Reference specific joints you can see (knees, hips, shoulders, elbows, ankles)
3. Describe the alignment or angle issues visible in the green lines
4. Compare how the skeleton changes position across different frames

Example phrases to use:
- "Looking at your skeleton overlay, I can see your knee angle is..."
- "The joint markers show your shoulders are..."
- "Across the frames, the skeleton shows your hip position..."

` : '';

  return `${basePrompt}
${skeletonContext}
FORMATTING RULES:
- Write conversationally to the athlete
- No markdown headers or bullet points
- Short paragraphs with line breaks
- 1-2 emojis naturally placed
- 120-180 words max
- End with "Quick tips:" and 2-3 suggestions
- Address as "you"`;
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
    const {
      videoUrl,
      videoId,
      frameUrls,
      discipline = 'football',
      poseDataFormatted  // NEW: Pose data from client
    } = body;

    if (!frameUrls || frameUrls.length === 0) {
      return NextResponse.json({
        error: 'No frames provided for analysis'
      }, { status: 400 });
    }

    // Build the message content with frame images
    // Use "high" detail for images with pose skeleton overlays so GPT-4 can see joints
    const imageContent = frameUrls.map((url: string) => ({
      type: "image_url" as const,
      image_url: {
        url: url,
        detail: "high" as const  // Changed from "low" to see skeleton details
      }
    }));

    // Enhance prompt with pose data if available
    const hasPoseData = !!poseDataFormatted;
    let enhancedPrompt = getAnalysisPrompt(discipline, hasPoseData);

    if (poseDataFormatted) {
      enhancedPrompt += `\n\nPOSE DETECTION DATA:\n${poseDataFormatted}\n\nUse this numerical data along with the visible skeleton overlay in the images to provide specific, measurable feedback about joint angles and body positioning.`;
    }

    // Call GPT-4 Vision with enhanced prompt
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
          role: "user",
          content: [
            { type: "text", text: enhancedPrompt },
            ...imageContent
          ]
        }
      ],
      max_tokens: 500,
    });

    const analysisText = response.choices[0]?.message?.content || 'Unable to generate analysis.';

    // Save to database
    const supabase = createServerSupabaseClient();
    let savedAnalysis = null;

    if (supabase) {
      // Get internal user ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      // Only save if we have both user and a valid UUID videoId
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const isValidUUID = videoId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);

      if (user && isValidUUID) {
        const { data, error } = await supabase
          .from('video_analyses')
          .insert({
            video_id: videoId,
            user_id: user.id,
            analysis_text: analysisText,
            discipline: discipline,
            frame_count: frameUrls.length,
            model_used: 'gpt-4o'
          })
          .select()
          .single();

        if (!error) {
          savedAnalysis = data;
        } else {
          console.error('Error saving analysis:', error);
        }
      } else if (!isValidUUID && videoId) {
        console.warn('Invalid UUID format for videoId, skipping database save:', videoId);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      savedAnalysis,
      frameCount: frameUrls.length
    });

  } catch (error: any) {
    console.error('Video analysis error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to analyze video'
    }, { status: 500 });
  }
}

// GET - Fetch analysis history for a video
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ analyses: [] });
    }

    // Get internal user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ analyses: [] });
    }

    let query = supabase
      .from('video_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (videoId) {
      query = query.eq('video_id', videoId);
    }

    const { data: analyses, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching analyses:', error);
      return NextResponse.json({ analyses: [] });
    }

    return NextResponse.json({ analyses: analyses || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60'
      }
    });

  } catch (error: any) {
    console.error('Get analyses error:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}
