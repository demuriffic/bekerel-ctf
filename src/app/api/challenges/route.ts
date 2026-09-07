import { NextResponse } from 'next/server';
import { db, challenges, categories, solves } from '@/db';
import { eq, asc, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { calculateDynamicPoints } from '@/lib/scoring';
import { getCtfStatus } from '@/lib/ctf';
import { initDb } from '@/db/migrate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    const session = await getSession();
    const isAdmin = Boolean(session && session.role === 'admin');

    // Fetch CTF status, categories, challenges, solve counts, and user's solves
    const [ctfStatus, allCategories, allChallenges, solveCounts, userSolveRows] = await Promise.all([
      getCtfStatus(),
      db.select().from(categories).orderBy(asc(categories.order)),
      db.select().from(challenges),
      db
        .select({
          challengeId: solves.challengeId,
          count: sql<number>`count(*)::int`,
        })
        .from(solves)
        .groupBy(solves.challengeId),
      session
        ? db
            .select({ challengeId: solves.challengeId })
            .from(solves)
            .where(eq(solves.userId, session.id))
        : Promise.resolve([]),
    ]);

    // If CTF is paused and user is not admin, completely block challenge visibility
    if (ctfStatus.isPaused && !isAdmin) {
      return NextResponse.json(
        {
          categories: allCategories,
          challenges: [],
          isPaused: true,
          isAdmin: false,
          message: 'The competition is currently paused.',
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
          },
        }
      );
    }

    const solvesByChallenge = new Map<string, number>();
    for (const sc of solveCounts) {
      solvesByChallenge.set(sc.challengeId, sc.count);
    }

    const userSolves = new Set<string>();
    for (const us of userSolveRows) {
      userSolves.add(us.challengeId);
    }

    const challengeTitleMap = new Map<string, string>();
    for (const c of allChallenges) {
      challengeTitleMap.set(c.id, c.title);
    }

    // Filter by published status and prerequisite completion
    // Non-admins only see challenges if prerequisite is solved (or no prerequisite)
    const visibleChallenges = allChallenges.filter((c) => {
      if (isAdmin) return true;
      if (c.status !== 'published') return false;
      if (c.prerequisiteId && !userSolves.has(c.prerequisiteId)) {
        return false;
      }
      return true;
    });

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
        prerequisiteId: c.prerequisiteId,
        prerequisiteTitle: c.prerequisiteId ? challengeTitleMap.get(c.prerequisiteId) || 'Unknown' : null,
        isSolved,
      };
    });

    return NextResponse.json(
      {
        categories: allCategories,
        challenges: formattedChallenges,
        isPaused: ctfStatus.isPaused,
        isAdmin,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
