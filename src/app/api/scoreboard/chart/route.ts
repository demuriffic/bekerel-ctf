import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { eq, and, asc } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Fetch non-banned competitors and solves in parallel
    const [allUsers, allSolves] = await Promise.all([
      db
        .select()
        .from(users)
        .where(and(eq(users.banned, false), eq(users.role, 'player'))),
      db.select().from(solves).orderBy(asc(solves.solvedAt)),
    ]);

    // Calculate total scores to find top 10
    const userScores = new Map<string, number>();
    for (const s of allSolves) {
      userScores.set(s.userId, (userScores.get(s.userId) || 0) + s.pointsAwarded);
    }

    const topUsers = allUsers
      .map((u) => ({ id: u.id, username: u.username, score: userScores.get(u.id) || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const topUserIds = new Set(topUsers.map((u) => u.id));
    const topUsernames = topUsers.map((u) => u.username);

    // Build timeline data points
    const runningScores = new Map<string, number>();
    for (const u of topUsers) {
      runningScores.set(u.username, 0);
    }

    const chartData: any[] = [];

    // Filter solves to top 10
    const relevantSolves = allSolves.filter((s) => topUserIds.has(s.userId));
    const userMap = new Map(topUsers.map((u) => [u.id, u.username]));

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
