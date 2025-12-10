import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, stats } = await req.json();

    // Check for API Key
    if (!process.env.OPENAI_API_KEY) {
      // Return a simulated response if no key is present
      return new NextResponse(
        "I'm ready to help! To make me fully functional, please add an OPENAI_API_KEY to your environment variables. For now, I can tell you that your training consistency looks great!", 
        { status: 200 }
      );
    }

    // System prompt with context
    const systemPrompt = `
      You are Coach Nova, an elite AI sports performance coach. 
      You are encouraging, strict but fair, and extremely knowledgeable about sports science.
      
      User's Current Stats:
      - Sessions Completed: ${stats?.totalSessions || 0}
      - Training Time: ${stats?.timeElapsed || 0} minutes
      - Calories Burned: ${stats?.caloriesBurned || 0}
      - Average Accuracy: ${stats?.avgAccuracy || 0}%
      
      Keep your responses concise (under 3 sentences) and action-oriented.
      Use emojis occasionally to be friendly.
      Always refer to the user as "Athlete".
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ 
            role: m.role === 'bot' ? 'assistant' : m.role, 
            content: m.text || m.content 
        })),
      ],
    });

    // Convert the response into a friendly text-stream
    const stream = new ReadableStream({
      async start(controller) {
        // @ts-ignore
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Return the actual error message for debugging
    return NextResponse.json(
      { error: error.message || 'Error communicating with OpenAI' },
      { status: 500 }
    );
  }
}
