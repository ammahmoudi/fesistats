import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { 
          error: 'Telegram bot not configured',
          message: 'Please set TELEGRAM_BOT_TOKEN in .env.local'
        },
        { status: 500 }
      );
    }

    // Get bot information from Telegram API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to get bot info:', response.status);
      return NextResponse.json(
        { 
          error: 'Failed to get bot info',
          message: 'Could not connect to Telegram API'
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        { 
          error: 'Telegram API error',
          message: data.description || 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      username: data.result.username,
      name: data.result.first_name,
    });

  } catch (error) {
    console.error('Telegram bot info error:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
