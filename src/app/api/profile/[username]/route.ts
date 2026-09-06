import { NextResponse } from 'next/server';
import { db, users, solves, challenges, categories } from '@/db';
import { eq, desc } from 'drizzle-orm';
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

    // Get all users and solves to compute rank
    const allUsers = await db.select().from(users).where(eq(users.banned, false));
    const allSolves = await db.select().from(solves);

    const scores = new Map<string, number>();
    for (const s of allSolves) {
      scores.set(s.userId, (scores.get(s.userId) || 0) + s.pointsAwarded);
    }

    const sortedUsers = allUsers
      .map((u) => ({ id: u.id, score: scores.get(u.id) || 0 }))
      .sort((a, b) => b.score - a.score);

    const rankIndex = sortedUsers.findIndex((u) => u.id === user.id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : sortedUsers.length;

    // Fetch user's solves with details
    const userSolves = await db
      .select()
      .from(solves)
      .where(eq(solves.userId, user.id))
      .orderBy(desc(solves.solvedAt));

    const allChallenges = await db.select().from(challenges);
    const allCategories = await db.select().from(categories);

    const challengeMap = new Map(allChallenges.map((c) => [c.id, c]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    // Category breakdown
    const catStats = new Map<string, { name: string; color: string; count: number; points: number }>();
    for (const cat of allCategories) {
      catStats.set(cat.id, { name: cat.name, color: cat.color, count: 0, points: 0 });
    }

    const detailedSolves = userSolves.map((s) => {
      const ch = challengeMap.get(s.challengeId);
      const cat = ch ? categoryMap.get(ch.categoryId) : null;

      if (cat) {
        const cs = catStats.get(cat.id);
        if (cs) {
          cs.count += 1;
          cs.points += s.pointsAwarded;
        }
      }

      return {
        id: s.id,
        challengeId: s.challengeId,
        challengeTitle: ch?.title || 'Unknown',
        categoryName: cat?.name || 'General',
        categoryColor: cat?.color || '#00ff41',
        pointsAwarded: s.pointsAwarded,
        solvedAt: s.solvedAt.toISOString(),
      };
    });

    const totalScore = userSolves.reduce((sum, s) => sum + s.pointsAwarded, 0);

    return NextResponse.json({
      player: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        rank,
        totalScore,
        solvesCount: userSolves.length,
      },
      categoryBreakdown: Array.from(catStats.values()).filter((c) => c.count > 0 || c.points > 0),
      solves: detailedSolves,
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
