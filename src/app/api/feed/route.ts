import { NextResponse } from 'next/server';
import { db, solves, users, challenges, categories } from '@/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Query latest 50 solves directly with JOINs
    const recentSolves = await db
      .select({
        id: solves.id,
        userId: solves.userId,
        username: users.username,
        challengeId: solves.challengeId,
        challengeTitle: challenges.title,
        categoryName: categories.name,
        categoryColor: categories.color,
        pointsAwarded: solves.pointsAwarded,
        solvedAt: solves.solvedAt,
      })
      .from(solves)
      .innerJoin(users, eq(users.id, solves.userId))
      .innerJoin(challenges, eq(challenges.id, solves.challengeId))
      .innerJoin(categories, eq(categories.id, challenges.categoryId))
      .orderBy(desc(solves.solvedAt))
      .limit(50);

    if (recentSolves.length === 0) {
      return NextResponse.json(
        { feed: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
          },
        }
      );
    }

    // Determine first blood by querying the earliest solve timestamp for these challenges only
    const challengeIds = Array.from(new Set(recentSolves.map((r) => r.challengeId)));
    const firstSolves = await db
      .select({
        challengeId: solves.challengeId,
        firstSolvedAt: sql<string>`min(${solves.solvedAt})`,
      })
      .from(solves)
      .where(inArray(solves.challengeId, challengeIds))
      .groupBy(solves.challengeId);

    const firstTimeMap = new Map<string, number>();
    for (const fs of firstSolves) {
      firstTimeMap.set(fs.challengeId, new Date(fs.firstSolvedAt).getTime());
    }

    const feed = recentSolves.map((s) => {
      const solveTime = new Date(s.solvedAt).getTime();
      const firstTime = firstTimeMap.get(s.challengeId);
      const isFirstBlood = firstTime !== undefined && solveTime === firstTime;

      return {
        id: s.id,
        username: s.username,
        challengeId: s.challengeId,
        challengeTitle: s.challengeTitle,
        categoryName: s.categoryName,
        categoryColor: s.categoryColor,
        pointsAwarded: s.pointsAwarded,
        solvedAt: s.solvedAt.toISOString(),
        isFirstBlood,
      };
    });

    return NextResponse.json(
      { feed },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
        },
      }
    );
  } catch (error: any) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
