import { NextResponse } from 'next/server';
import { db, solves, users, challenges, categories } from '@/db';
import { desc, asc } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();

    // Fetch solves, users, challenges, and categories in parallel
    const [allSolvesAsc, recentSolves, allUsers, allChallenges, allCategories] = await Promise.all([
      db.select({ id: solves.id, challengeId: solves.challengeId }).from(solves).orderBy(asc(solves.solvedAt)),
      db.select().from(solves).orderBy(desc(solves.solvedAt)).limit(50),
      db.select({ id: users.id, username: users.username }).from(users),
      db.select({ id: challenges.id, title: challenges.title, categoryId: challenges.categoryId }).from(challenges),
      db.select().from(categories),
    ]);

    const firstBloods = new Set<string>();
    const seenChallenges = new Set<string>();

    for (const s of allSolvesAsc) {
      if (!seenChallenges.has(s.challengeId)) {
        firstBloods.add(s.id);
        seenChallenges.add(s.challengeId);
      }
    }

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
