import { NextResponse } from 'next/server';
import { db, users, solves, challenges, categories } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await initDb();
    const { username } = await params;

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Fetch user's solves with challenge and category details joined in a single SQL query
    const userDetailedSolves = await db
      .select({
        id: solves.id,
        challengeId: solves.challengeId,
        challengeTitle: challenges.title,
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        pointsAwarded: solves.pointsAwarded,
        solvedAt: solves.solvedAt,
      })
      .from(solves)
      .innerJoin(challenges, eq(challenges.id, solves.challengeId))
      .innerJoin(categories, eq(categories.id, challenges.categoryId))
      .where(eq(solves.userId, user.id))
      .orderBy(desc(solves.solvedAt));

    const totalScore = userDetailedSolves.reduce((sum, s) => sum + s.pointsAwarded, 0);

    // Compute rank for players
    let rank = 0;
    if (user.role === 'player') {
      const userLastSolve = userDetailedSolves.length > 0 ? userDetailedSolves[0].solvedAt : null;

      const playerScores = await db
        .select({
          userId: users.id,
          score: sql<number>`coalesce(sum(${solves.pointsAwarded}), 0)::int`,
          lastSolve: sql<string | null>`max(${solves.solvedAt})`,
        })
        .from(users)
        .leftJoin(solves, eq(solves.userId, users.id))
        .where(and(eq(users.banned, false), eq(users.role, 'player')))
        .groupBy(users.id);

      let higherCount = 0;
      for (const p of playerScores) {
        if (p.userId === user.id) continue;
        if (p.score > totalScore) {
          higherCount++;
        } else if (p.score === totalScore) {
          if (p.lastSolve && userLastSolve) {
            if (new Date(p.lastSolve).getTime() < new Date(userLastSolve).getTime()) {
              higherCount++;
            }
          } else if (p.lastSolve && !userLastSolve) {
            higherCount++;
          }
        }
      }
      rank = higherCount + 1;
    }

    // Category breakdown derived directly from user's solves
    const catStats = new Map<string, { name: string; color: string; count: number; points: number }>();
    for (const s of userDetailedSolves) {
      const existing = catStats.get(s.categoryId) || {
        name: s.categoryName,
        color: s.categoryColor,
        count: 0,
        points: 0,
      };
      existing.count += 1;
      existing.points += s.pointsAwarded;
      catStats.set(s.categoryId, existing);
    }

    const formattedSolves = userDetailedSolves.map((s) => ({
      id: s.id,
      challengeId: s.challengeId,
      challengeTitle: s.challengeTitle,
      categoryName: s.categoryName,
      categoryColor: s.categoryColor,
      pointsAwarded: s.pointsAwarded,
      solvedAt: s.solvedAt.toISOString(),
    }));

    return NextResponse.json({
      player: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        rank,
        totalScore,
        solvesCount: userDetailedSolves.length,
      },
      categoryBreakdown: Array.from(catStats.values()),
      solves: formattedSolves,
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
