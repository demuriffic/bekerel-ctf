import { NextResponse } from 'next/server';
import { getCtfStatus } from '@/lib/ctf';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getCtfStatus();
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching CTF status:', error);
    return NextResponse.json({ error: 'Failed to retrieve CTF status' }, { status: 500 });
  }
}
