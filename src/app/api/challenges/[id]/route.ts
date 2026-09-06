import { NextResponse } from 'next/server';
import { db, challenges, categories, solves } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { calculateDynamicPoints } from '@/lib/scoring';
import { initDb } from '@/db/migrate';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = await getSession();

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status !== 'published' && (!session || session.role !== 'admin')) {
      return NextResponse.json({ error: 'Challenge not available' }, { status: 404 });
    }

    const [category] = await db.select().from(categories).where(eq(categories.id, challenge.categoryId)).limit(1);

    const challengeSolves = await db.select().from(solves).where(eq(solves.challengeId, challenge.id));
    const solveCount = challengeSolves.length;
    const currentPoints = calculateDynamicPoints(
      challenge.maxPoints,
      challenge.minPoints,
      challenge.decayFactor,
      solveCount
    );

    let isSolved = false;
    if (session) {
      const [userSolve] = await db
        .select()
        .from(solves)
        .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.id)))
        .limit(1);
      isSolved = !!userSolve;
    }

    return NextResponse.json({
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
        isSolved,
        // Flag is NEVER returned!
      },
    });
  } catch (error: any) {
    console.error('Error fetching challenge detail:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
