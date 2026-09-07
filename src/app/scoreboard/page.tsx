import { db, users, solves } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';
import ScoreboardTable from '@/components/ScoreboardTable';
import { Trophy, LineChart } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ScoreboardPage() {
  await initDb();

  // Query leaderboard via SQL aggregation
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#00ff41]" />
            SCOREBOARD
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Live rankings of players.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/scoreboard/chart"
            className="flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] hover:border-[#00ff41]/40 text-xs font-mono-code text-cyan-400 transition-all shadow-sm"
          >
            <LineChart className="w-4 h-4" />
            <span>Timeline Graph</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 */}
          <div className="order-2 md:order-1 p-5 rounded-lg border border-slate-700/60 bg-[#0c1311] text-center space-y-2 relative overflow-hidden">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-500/10 border border-slate-400/30 flex items-center justify-center text-slate-300 font-bold text-lg font-mono-code">
              2
            </div>
            <div className="font-mono-code font-bold text-white text-lg truncate">
              <Link href={`/profile/${leaderboard[1].username}`} className="hover:text-[#00ff41]">
                {leaderboard[1].username}
              </Link>
            </div>
            <div className="text-2xl font-black font-mono-code text-slate-300">
              {leaderboard[1].score} <span className="text-xs font-normal text-gray-500">PTS</span>
            </div>
            <div className="text-xs text-gray-400 font-mono-code">
              {leaderboard[1].solvesCount} solves
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="order-1 md:order-2 p-6 rounded-lg border border-amber-500/50 bg-[#121913] text-center space-y-2 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.15)] md:-translate-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-extrabold text-xl font-mono-code shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              👑
            </div>
            <div className="font-mono-code font-extrabold text-[#00ff41] text-xl truncate">
              <Link href={`/profile/${leaderboard[0].username}`} className="hover:underline">
                {leaderboard[0].username}
              </Link>
            </div>
            <div className="text-3xl font-black font-mono-code text-amber-400">
              {leaderboard[0].score} <span className="text-xs font-normal text-gray-400">PTS</span>
            </div>
            <div className="text-xs text-gray-300 font-mono-code">
              {leaderboard[0].solvesCount} solves
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 md:order-3 p-5 rounded-lg border border-amber-900/40 bg-[#0c1311] text-center space-y-2 relative overflow-hidden">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-950/20 border border-amber-700/30 flex items-center justify-center text-amber-600 font-bold text-lg font-mono-code">
              3
            </div>
            <div className="font-mono-code font-bold text-white text-lg truncate">
              <Link href={`/profile/${leaderboard[2].username}`} className="hover:text-[#00ff41]">
                {leaderboard[2].username}
              </Link>
            </div>
            <div className="text-2xl font-black font-mono-code text-amber-600">
              {leaderboard[2].score} <span className="text-xs font-normal text-gray-500">PTS</span>
            </div>
            <div className="text-xs text-gray-400 font-mono-code">
              {leaderboard[2].solvesCount} solves
            </div>
          </div>
        </div>
      )}

      {/* Interactive Leaderboard Table (Island) */}
      <ScoreboardTable leaderboard={leaderboard} />
    </div>
  );
}
