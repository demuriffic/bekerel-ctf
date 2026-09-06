import { NextResponse } from 'next/server';
import { db, submissions, users, challenges, categories } from '@/db';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const allSubmissions = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt))
      .limit(limit);

    const allUsers = await db.select().from(users);
    const allChallenges = await db.select().from(challenges);
    const allCategories = await db.select().from(categories);

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const challengeMap = new Map(allChallenges.map((c) => [c.id, c]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    const data = allSubmissions.map((s) => {
      const user = userMap.get(s.userId);
      const challenge = challengeMap.get(s.challengeId);
      const category = challenge ? categoryMap.get(challenge.categoryId) : null;

      return {
        id: s.id,
        userId: s.userId,
        username: user?.username || 'Unknown',
        email: user?.email || 'Unknown',
        challengeId: s.challengeId,
        challengeTitle: challenge?.title || 'Unknown Challenge',
        categoryName: category?.name || 'General',
        submittedFlag: s.submittedFlag,
        correct: s.correct,
        submittedAt: s.submittedAt.toISOString(),
      };
    });

    return NextResponse.json({ submissions: data });
  } catch (error: any) {
    console.error('Admin submissions error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
