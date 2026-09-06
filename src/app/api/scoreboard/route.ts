import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { eq, and } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Get non-banned competitors and all solves in parallel
    const [allUsers, allSolves] = await Promise.all([
      db
        .select()
        .from(users)
        .where(and(eq(users.banned, false), eq(users.role, 'player'))),
      db.select().from(solves),
    ]);

    // Group solves by user
    const userStats = new Map<
      string,
      {
        id: string;
        username: string;
        score: number;
        solvesCount: number;
        lastSolveAt: Date | null;
      }
    >();

    for (const u of allUsers) {
      userStats.set(u.id, {
        id: u.id,
        username: u.username,
        score: 0,
        solvesCount: 0,
        lastSolveAt: null,
      });
    }

    for (const s of allSolves) {
      const stats = userStats.get(s.userId);
      if (stats) {
        stats.score += s.pointsAwarded;
        stats.solvesCount += 1;
        const solveDate = new Date(s.solvedAt);
        if (!stats.lastSolveAt || solveDate > stats.lastSolveAt) {
          stats.lastSolveAt = solveDate;
        }
      }
    }

    // Sort by score desc, then by lastSolveAt asc (earlier solve is better), then username
    const leaderboard = Array.from(userStats.values())
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.lastSolveAt && b.lastSolveAt) {
          return a.lastSolveAt.getTime() - b.lastSolveAt.getTime();
        }
        if (a.lastSolveAt && !b.lastSolveAt) return -1;
        if (!a.lastSolveAt && b.lastSolveAt) return 1;
        return a.username.localeCompare(b.username);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        lastSolveAt: entry.lastSolveAt ? entry.lastSolveAt.toISOString() : null,
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
