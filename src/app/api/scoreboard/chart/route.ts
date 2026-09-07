import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { eq, and, asc, inArray, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Query top 10 players directly in SQL
    const topUsers = await db
      .select({
        id: users.id,
        username: users.username,
        score: sql<number>`coalesce(sum(${solves.pointsAwarded}), 0)::int`,
      })
      .from(users)
      .leftJoin(solves, eq(solves.userId, users.id))
      .where(and(eq(users.banned, false), eq(users.role, 'player')))
      .groupBy(users.id, users.username)
      .orderBy(sql`coalesce(sum(${solves.pointsAwarded}), 0) DESC`, users.username)
      .limit(10);

    if (topUsers.length === 0) {
      return NextResponse.json(
        { players: [], chartData: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=15',
          },
        }
      );
    }

    const topUserIds = topUsers.map((u) => u.id);
    const topUsernames = topUsers.map((u) => u.username);
    const userMap = new Map(topUsers.map((u) => [u.id, u.username]));

    // Query solves only for the top 10 users
    const relevantSolves = await db
      .select({
        userId: solves.userId,
        pointsAwarded: solves.pointsAwarded,
        solvedAt: solves.solvedAt,
      })
      .from(solves)
      .where(inArray(solves.userId, topUserIds))
      .orderBy(asc(solves.solvedAt));

    // Build timeline data points
    const runningScores = new Map<string, number>();
    for (const u of topUsers) {
      runningScores.set(u.username, 0);
    }

    const chartData: any[] = [];

    for (const s of relevantSolves) {
      const username = userMap.get(s.userId);
      if (!username) continue;

      const current = runningScores.get(username) || 0;
      runningScores.set(username, current + s.pointsAwarded);

      chartData.push({
        time: new Date(s.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...Object.fromEntries(runningScores.entries()),
      });
    }

    return NextResponse.json(
      {
        players: topUsernames,
        chartData,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=15',
        },
      }
    );
  } catch (error: any) {
    console.error('Scoreboard chart error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
