import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { eq, inArray, asc } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Fetch non-banned users
    const allUsers = await db.select().from(users).where(eq(users.banned, false));
    const allSolves = await db.select().from(solves).orderBy(asc(solves.solvedAt));

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

    // Filter solves to top users
    const relevantSolves = allSolves.filter((s) => topUserIds.has(s.userId));

    // Cumulative progression
    const runningScores: Record<string, number> = {};
    for (const u of topUsers) {
      runningScores[u.username] = 0;
    }

    const chartData: any[] = [];
    const userMap = new Map(allUsers.map((u) => [u.id, u.username]));

    for (const s of relevantSolves) {
      const username = userMap.get(s.userId);
      if (username) {
        runningScores[username] = (runningScores[username] || 0) + s.pointsAwarded;
        chartData.push({
          time: new Date(s.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(s.solvedAt).getTime(),
          ...runningScores,
        });
      }
    }

    return NextResponse.json({
      players: topUsernames,
      chartData,
    });
  } catch (error: any) {
    console.error('Scoreboard chart error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
