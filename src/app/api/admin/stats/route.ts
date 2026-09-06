import { NextResponse } from 'next/server';
import { db, users, challenges, categories, solves, submissions } from '@/db';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const allUsers = await db.select().from(users);
    const allChallenges = await db.select().from(challenges);
    const allCategories = await db.select().from(categories);
    const allSolves = await db.select().from(solves).orderBy(desc(solves.solvedAt));
    const allSubmissions = await db.select().from(submissions);

    const totalPlayers = allUsers.filter((u) => u.role === 'player' && !u.banned).length;
    const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;
    const totalBanned = allUsers.filter((u) => u.banned).length;

    const totalChallenges = allChallenges.length;
    const publishedChallenges = allChallenges.filter((c) => c.status === 'published').length;

    const totalSolves = allSolves.length;
    const totalSubmissions = allSubmissions.length;
    const correctSubmissions = allSubmissions.filter((s) => s.correct).length;
    const successRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

    // Category breakdown
    const categoryStats = allCategories.map((cat) => {
      const catChallenges = allChallenges.filter((c) => c.categoryId === cat.id);
      const catChallengeIds = new Set(catChallenges.map((c) => c.id));
      const catSolves = allSolves.filter((s) => catChallengeIds.has(s.challengeId)).length;

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        challengesCount: catChallenges.length,
        solvesCount: catSolves,
      };
    });

    return NextResponse.json({
      stats: {
        totalPlayers,
        totalAdmins,
        totalBanned,
        totalChallenges,
        publishedChallenges,
        totalSolves,
        totalSubmissions,
        successRate,
      },
      categoryStats,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
