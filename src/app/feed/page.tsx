import { db, solves, users, challenges, categories } from '@/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';
import FeedList, { FeedItem } from '@/components/FeedList';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  await initDb();

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

  let initialFeed: FeedItem[] = [];

  if (recentSolves.length > 0) {
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

    initialFeed = recentSolves.map((s) => {
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
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#00ff41]" />
            SOLVE FEED
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Live stream of challenge solves.
          </p>
        </div>
      </div>

      <FeedList initialFeed={initialFeed} />
    </div>
  );
}
