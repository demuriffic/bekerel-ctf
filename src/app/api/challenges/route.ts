import { NextResponse } from 'next/server';
import { db, challenges, categories, solves } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { calculateDynamicPoints } from '@/lib/scoring';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const session = await getSession();

    // Fetch categories
    const allCategories = await db.select().from(categories).orderBy(asc(categories.order));

    // Fetch challenges (published only for players, or all for admin)
    const allChallenges = await db.select().from(challenges);
    const visibleChallenges = allChallenges.filter(
      (c) => c.status === 'published' || (session && session.role === 'admin')
    );

    // Fetch all solves to compute solve counts and user solve status
    const allSolves = await db.select().from(solves);

    const solvesByChallenge = new Map<string, number>();
    const userSolves = new Set<string>();

    for (const s of allSolves) {
      solvesByChallenge.set(s.challengeId, (solvesByChallenge.get(s.challengeId) || 0) + 1);
      if (session && s.userId === session.id) {
        userSolves.add(s.challengeId);
      }
    }

    const formattedChallenges = visibleChallenges.map((c) => {
      const solveCount = solvesByChallenge.get(c.id) || 0;
      const currentPoints = calculateDynamicPoints(c.maxPoints, c.minPoints, c.decayFactor, solveCount);
      const isSolved = userSolves.has(c.id);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        categoryId: c.categoryId,
        currentPoints,
        maxPoints: c.maxPoints,
        minPoints: c.minPoints,
        decayFactor: c.decayFactor,
        solveCount,
        status: c.status,
        attachmentUrl: c.attachmentUrl,
        isSolved,
        // Flag is intentionally omitted!
      };
    });

    return NextResponse.json({
      categories: allCategories,
      challenges: formattedChallenges,
    });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
