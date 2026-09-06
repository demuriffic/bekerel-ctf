import { NextResponse } from 'next/server';
import { db, solves, users, challenges, categories } from '@/db';
import { desc, asc } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Fetch all solves to determine first bloods
    const allSolvesAsc = await db.select().from(solves).orderBy(asc(solves.solvedAt));
    const firstBloods = new Set<string>();
    const seenChallenges = new Set<string>();

    for (const s of allSolvesAsc) {
      if (!seenChallenges.has(s.challengeId)) {
        firstBloods.add(s.id);
        seenChallenges.add(s.challengeId);
      }
    }

    // Fetch recent solves
    const recentSolves = await db.select().from(solves).orderBy(desc(solves.solvedAt)).limit(50);

    const allUsers = await db.select().from(users);
    const allChallenges = await db.select().from(challenges);
    const allCategories = await db.select().from(categories);

    const userMap = new Map(allUsers.map((u) => [u.id, u.username]));
    const challengeMap = new Map(allChallenges.map((c) => [c.id, c]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    const feed = recentSolves.map((s) => {
      const challenge = challengeMap.get(s.challengeId);
      const category = challenge ? categoryMap.get(challenge.categoryId) : null;

      return {
        id: s.id,
        username: userMap.get(s.userId) || 'Anonymous',
        challengeId: s.challengeId,
        challengeTitle: challenge?.title || 'Unknown Challenge',
        categoryName: category?.name || 'General',
        categoryColor: category?.color || '#00ff41',
        pointsAwarded: s.pointsAwarded,
        solvedAt: s.solvedAt.toISOString(),
        isFirstBlood: firstBloods.has(s.id),
      };
    });

    return NextResponse.json({ feed });
  } catch (error: any) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
