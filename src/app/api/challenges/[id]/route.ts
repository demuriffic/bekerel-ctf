import { NextResponse } from 'next/server';
import { db, challenges, categories, solves } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { getCtfStatus } from '@/lib/ctf';
import { calculateDynamicPoints } from '@/lib/scoring';
import { initDb } from '@/db/migrate';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = await getSession();
    const isAdmin = Boolean(session && session.role === 'admin');

    const [challenge, ctfStatus] = await Promise.all([
      db.select().from(challenges).where(eq(challenges.id, id)).limit(1).then((r) => r[0]),
      getCtfStatus(),
    ]);

    // If CTF is paused and user is not admin, completely block challenge access
    if (ctfStatus.isPaused && !isAdmin) {
      return NextResponse.json(
        { error: 'The competition is currently paused.', isPaused: true, isAdmin: false },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
          },
        }
      );
    }

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status !== 'published' && !isAdmin) {
      return NextResponse.json({ error: 'Challenge not available' }, { status: 404 });
    }

    // Prerequisite check: Hidden unless user solved prerequisite (admins bypass)
    if (challenge.prerequisiteId && !isAdmin) {
      if (!session) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
      const [prereqSolve] = await db
        .select({ id: solves.id })
        .from(solves)
        .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.prerequisiteId)))
        .limit(1);

      if (!prereqSolve) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
    }

    const [category, [solveCountRow], userSolve] = await Promise.all([
      db.select().from(categories).where(eq(categories.id, challenge.categoryId)).limit(1).then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(solves)
        .where(eq(solves.challengeId, challenge.id)),
      session
        ? db
            .select()
            .from(solves)
            .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.id)))
            .limit(1)
            .then((r) => r[0])
        : Promise.resolve(null),
    ]);

    const solveCount = solveCountRow?.count || 0;
    const currentPoints = calculateDynamicPoints(
      challenge.maxPoints,
      challenge.minPoints,
      challenge.decayFactor,
      solveCount
    );

    return NextResponse.json(
      {
        isPaused: ctfStatus.isPaused,
        isAdmin,
        challenge: {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          categoryId: challenge.categoryId,
          categoryName: category?.name || 'Unknown',
          categoryColor: category?.color || '#00ff41',
          currentPoints,
          maxPoints: challenge.maxPoints,
          minPoints: challenge.minPoints,
          decayFactor: challenge.decayFactor,
          solveCount,
          status: challenge.status,
          attachmentUrl: challenge.attachmentUrl,
          isSolved: Boolean(userSolve),
          // Flag is NEVER returned!
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching challenge detail:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
