import { NextResponse } from 'next/server';
import { db, users, challenges, categories, solves, submissions, ctfSettings } from '@/db';
import { eq, ne } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb, seedAdmin } from '@/db/migrate';

export async function POST(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'competition'; // 'competition' | 'factory'

    if (mode === 'competition') {
      // Wipe all solves and submissions
      await db.delete(solves);
      await db.delete(submissions);

      // Reset timer and pause status
      await db
        .update(ctfSettings)
        .set({ isPaused: false })
        .where(eq(ctfSettings.id, 1));

      return NextResponse.json({
        success: true,
        message: 'Competition reset successfully: All solves and submission audit logs have been wiped.',
      });
    }

    if (mode === 'factory') {
      // Full factory reset: wipes solves, submissions, non-admin players, custom challenges, resets settings
      await db.delete(solves);
      await db.delete(submissions);
      await db.delete(users).where(ne(users.role, 'admin'));
      await db.delete(challenges);
      await db.delete(categories);

      await db
        .update(ctfSettings)
        .set({
          startTime: null,
          endTime: null,
          isPaused: false,
        })
        .where(eq(ctfSettings.id, 1));

      // Re-seed starter challenges and categories
      await seedAdmin();

      return NextResponse.json({
        success: true,
        message: 'Factory reset complete: Platform restored to initial configuration with starter challenges.',
      });
    }

    return NextResponse.json({ error: 'Invalid reset mode' }, { status: 400 });
  } catch (error: any) {
    console.error('Reset competition error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset competition' }, { status: 500 });
  }
}
