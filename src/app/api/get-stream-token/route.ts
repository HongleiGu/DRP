import { NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const userName = searchParams.get('userName') || 'Anonymous';

    // console.log(process.env.NEXT_PUBLIC_STREAM_API_KEY, process.env.NEXT_PUBLIC_STREAM_SECRET_KEY)
    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.NEXT_PUBLIC_STREAM_SECRET_KEY!,
      { timeout: 3000 }
    );

    const token = streamClient.generateUserToken({user_id: userId})
    
    return NextResponse.json({ 
      token,
      user: {
        id: userId,
        name: userName
      }
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}