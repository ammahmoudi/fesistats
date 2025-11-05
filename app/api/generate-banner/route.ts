import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { milestone, platform, customText } = body;

    if (!milestone && !customText) {
      return NextResponse.json(
        { error: 'Milestone or custom text is required' },
        { status: 400 }
      );
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Create platform-specific prompts
    let prompt = '';
    
    if (milestone) {
      const platformInfo = {
        'YouTube': {
          suffix: 'subscribers',
          emoji: '🎥',
          color: 'red',
          vibes: 'epic cinematic celebration with camera flashes'
        },
        'Telegram': {
          suffix: 'members',
          emoji: '💬',
          color: 'blue',
          vibes: 'digital celebration with connected nodes and messages'
        },
        'Instagram': {
          suffix: 'followers',
          emoji: '📸',
          color: 'pink/purple',
          vibes: 'glamorous celebration with photos and hearts'
        }
      };
      
      const info = platformInfo[platform as keyof typeof platformInfo] || platformInfo['YouTube'];
      
      prompt = `You are creating a celebratory social media milestone banner for ItzFesi.

CRITICAL REQUIREMENTS:
1. Featured person: ItzFesi's face MUST be clearly visible and prominent in the center or featured area
2. Milestone: ${milestone} ${info.suffix} on ${platform} ${info.emoji}
3. Style: ${info.vibes}
4. Color scheme: Predominantly ${info.color} with gold and white accents
5. Elements: Include large glowing numbers "${milestone}", ${platform} logo/icon, confetti burst, stars, light rays
6. Text: Add "${milestone}" prominently, add "🎉" celebration emoji
7. Format: Horizontal banner, optimized for Telegram (max 1024x512)
8. Mood: Triumphant, exciting, festive - celebrate this achievement!

Make it eye-catching with vibrant colors, dynamic composition, and celebratory energy. The image should make followers excited about this milestone!`;
    } else {
      prompt = `You are creating a celebratory social media banner for ItzFesi.

CRITICAL REQUIREMENTS:
1. Featured person: ItzFesi's face MUST be clearly visible and prominent
2. Message: "${customText}"
3. Style: Vibrant, festive, celebratory
4. Color scheme: Bright, eye-catching colors
5. Format: Horizontal banner, optimized for Telegram
6. Mood: Exciting and engaging

Make it stand out and engage followers!`;
    }

    // Call OpenRouter API with Gemini 2.0 Flash Experimental
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://itzfesi.ir',
        'X-Title': 'FesiStats - AI Banner Generator',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'OpenRouter API error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'No response from AI model', details: data },
        { status: 500 }
      );
    }

    const message = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: message,
      note: 'Image generation requires additional setup. Use the generated description to create images via other services.'
    });
  } catch (error) {
    console.error('Error generating banner:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate banner',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
