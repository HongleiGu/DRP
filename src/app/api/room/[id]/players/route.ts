/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@clerk/nextjs/server'
import { getPlayers } from '@/utils/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  return NextResponse.json({
    players: await getPlayers((await params).id)
  });
}