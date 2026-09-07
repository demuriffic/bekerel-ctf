import { db, challenges, categories, solves } from '@/db';
import { eq, asc, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { calculateDynamicPoints } from '@/lib/scoring';
import { getCtfStatus } from '@/lib/ctf';
import { initDb } from '@/db/migrate';
import ChallengeBoard from '@/components/ChallengeBoard';
import { Shield, PauseCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
  await initDb();
  const session = await getSession();
  const isAdmin = Boolean(session && session.role === 'admin');

  // Fetch CTF status, categories, challenges, solve counts, and user's solves in parallel
  const [ctfStatus, allCategories, allChallenges, solveCounts, userSolveRows] = await Promise.all([
    getCtfStatus(),
    db.select().from(categories).orderBy(asc(categories.order)),
    db.select().from(challenges),
    db
      .select({
        challengeId: solves.challengeId,
        count: sql<number>`count(*)::int`,
      })
      .from(solves)
      .groupBy(solves.challengeId),
    session
      ? db
          .select({ challengeId: solves.challengeId })
          .from(solves)
          .where(eq(solves.userId, session.id))
      : Promise.resolve([]),
  ]);

  // Non-admins cannot see any challenges when paused
  if (ctfStatus.isPaused && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-xl border border-amber-500/30 bg-[#0d1613] text-center space-y-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <PauseCircle className="w-12 h-12 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold font-mono-code text-white">
              COMPETITION PAUSED
            </h1>
            <p className="text-base text-gray-400 font-mono-code max-w-lg mx-auto">
              Challenges are temporarily unavailable while the competition is paused. Please check back shortly.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/scoreboard"
              className="px-5 py-2.5 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] hover:border-[#00ff41]/50 text-white text-sm font-mono-code transition-all"
            >
              View Scoreboard
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const solvesByChallenge = new Map<string, number>();
  for (const sc of solveCounts) {
    solvesByChallenge.set(sc.challengeId, sc.count);
  }

  const userSolves = new Set<string>();
  for (const us of userSolveRows) {
    userSolves.add(us.challengeId);
  }

  const challengeTitleMap = new Map<string, string>();
  for (const c of allChallenges) {
    challengeTitleMap.set(c.id, c.title);
  }

  // Filter visible challenges:
  // Non-admins only see published challenges whose prerequisite has been solved (or has no prerequisite)
  const visibleChallenges = allChallenges.filter((c) => {
    if (isAdmin) return true;
    if (c.status !== 'published') return false;
    if (c.prerequisiteId && !userSolves.has(c.prerequisiteId)) {
      return false;
    }
    return true;
  });

  const formattedChallenges = visibleChallenges.map((c) => {
    const solveCount = solvesByChallenge.get(c.id) || 0;
    const currentPoints = calculateDynamicPoints(c.maxPoints, c.minPoints, c.decayFactor, solveCount);
    const isSolved = userSolves.has(c.id);

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      categoryId: c.categoryId,
      currentPoints,
      maxPoints: c.maxPoints,
      minPoints: c.minPoints,
      decayFactor: c.decayFactor,
      solveCount,
      status: c.status,
      attachmentUrl: c.attachmentUrl,
      prerequisiteId: c.prerequisiteId,
      prerequisiteTitle: c.prerequisiteId ? challengeTitleMap.get(c.prerequisiteId) || 'Unknown' : null,
      isSolved,
    };
  });

  const totalSolves = formattedChallenges.filter((c) => c.isSolved).length;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00ff41]" />
            CHALLENGES
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Solve challenges to earn points. Points dynamically decay as more players solve them.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] flex items-center gap-3">
            <div className="text-xs font-mono-code text-gray-400">Solved:</div>
            <div className="text-lg font-bold font-mono-code text-[#00ff41]">
              {totalSolves} / {formattedChallenges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Paused Banner */}
      {ctfStatus.isPaused && isAdmin && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse" />
            <div className="text-sm font-mono-code">
              <span className="font-bold">Competition Paused:</span> Non-admin players cannot see challenges. As an admin, you have full preview access.
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-mono-code underline hover:text-amber-300 whitespace-nowrap"
          >
            Manage in Settings &rarr;
          </Link>
        </div>
      )}

      {/* Interactive Challenge Board (Island) */}
      <ChallengeBoard
        challenges={formattedChallenges}
        categories={allCategories}
        isAdmin={isAdmin}
      />
    </div>
  );
}
