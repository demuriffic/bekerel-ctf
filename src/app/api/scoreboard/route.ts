import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Query leaderboard via SQL aggregation instead of loading all solves in memory
    const leaderboardRows = await db
      .select({
        id: users.id,
        username: users.username,
        score: sql<number>`coalesce(sum(${solves.pointsAwarded}), 0)::int`,
        solvesCount: sql<number>`count(${solves.id})::int`,
        lastSolveAt: sql<string | null>`max(${solves.solvedAt})`,
      })
      .from(users)
      .leftJoin(solves, eq(solves.userId, users.id))
      .where(and(eq(users.banned, false), eq(users.role, 'player')))
      .groupBy(users.id, users.username)
      .orderBy(
        sql`coalesce(sum(${solves.pointsAwarded}), 0) DESC`,
        sql`max(${solves.solvedAt}) ASC NULLS LAST`,
        users.username
      );

    const leaderboard = leaderboardRows.map((entry, index) => ({
      rank: index + 1,
      id: entry.id,
      username: entry.username,
      score: entry.score,
      solvesCount: entry.solvesCount,
      lastSolveAt: entry.lastSolveAt ? new Date(entry.lastSolveAt).toISOString() : null,
    }));

    return NextResponse.json(
      { leaderboard },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=15',
        },
      }
    );
  } catch (error: any) {
    console.error('Scoreboard error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
