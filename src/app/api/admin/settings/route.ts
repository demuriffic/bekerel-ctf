import { NextResponse } from 'next/server';
import { db, ctfSettings } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const [settings] = await db.select().from(ctfSettings).where(eq(ctfSettings.id, 1)).limit(1);

    return NextResponse.json({
      settings: {
        startTime: settings?.startTime ? settings.startTime.toISOString() : null,
        endTime: settings?.endTime ? settings.endTime.toISOString() : null,
        isPaused: Boolean(settings?.isPaused),
      },
    });
  } catch (error: any) {
    console.error('Admin get settings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { startTime, endTime, isPaused } = body;

    const startDate = startTime ? new Date(startTime) : null;
    const endDate = endTime ? new Date(endTime) : null;

    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start time format' }, { status: 400 });
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid end time format' }, { status: 400 });
    }

    if (startDate && endDate && startDate >= endDate) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    const [updated] = await db
      .update(ctfSettings)
      .set({
        ...(startTime !== undefined && { startTime: startDate }),
        ...(endTime !== undefined && { endTime: endDate }),
        ...(isPaused !== undefined && { isPaused: Boolean(isPaused) }),
      })
      .where(eq(ctfSettings.id, 1))
      .returning();

    return NextResponse.json({
      success: true,
      settings: {
        startTime: updated?.startTime ? updated.startTime.toISOString() : null,
        endTime: updated?.endTime ? updated.endTime.toISOString() : null,
        isPaused: Boolean(updated?.isPaused),
      },
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
