import { NextResponse } from 'next/server';
import { db, challenges, categories, solves, users } from '@/db';
import { desc, asc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { calculateDynamicPoints } from '@/lib/scoring';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const allChallenges = await db.select().from(challenges).orderBy(desc(challenges.createdAt));
    const allCategories = await db.select().from(categories);
    const allSolves = await db.select().from(solves).orderBy(asc(solves.solvedAt));
    const allUsers = await db.select().from(users);

    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
    const userMap = new Map(allUsers.map((u) => [u.id, u.username]));

    // Find solve count and first blood per challenge
    const solveCounts = new Map<string, number>();
    const firstBlood = new Map<string, { username: string; solvedAt: string }>();

    for (const s of allSolves) {
      solveCounts.set(s.challengeId, (solveCounts.get(s.challengeId) || 0) + 1);
      if (!firstBlood.has(s.challengeId)) {
        firstBlood.set(s.challengeId, {
          username: userMap.get(s.userId) || 'Unknown',
          solvedAt: s.solvedAt.toISOString(),
        });
      }
    }

    const totalUsers = allUsers.filter((u) => !u.banned).length;

    const data = allChallenges.map((c) => {
      const category = categoryMap.get(c.categoryId);
      const count = solveCounts.get(c.id) || 0;
      const currentPoints = calculateDynamicPoints(c.maxPoints, c.minPoints, c.decayFactor, count);
      const fb = firstBlood.get(c.id) || null;
      const solveRate = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

      return {
        ...c,
        categoryName: category?.name || 'Uncategorized',
        categoryColor: category?.color || '#00ff41',
        solveCount: count,
        currentPoints,
        firstBlood: fb,
        solveRate,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ challenges: data, categories: allCategories });
  } catch (error: any) {
    console.error('Admin challenges error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      flag,
      categoryId,
      maxPoints = 500,
      minPoints = 100,
      decayFactor = 50,
      status = 'draft',
      attachmentUrl,
    } = body;

    if (!title || !description || !flag || !categoryId) {
      return NextResponse.json(
        { error: 'Title, description, flag, and category are required' },
        { status: 400 }
      );
    }

    const numMax = Number(maxPoints);
    const numMin = Number(minPoints);
    const numDecay = Number(decayFactor);

    if (isNaN(numMax) || isNaN(numMin) || isNaN(numDecay) || numMin <= 0) {
      return NextResponse.json(
        { error: 'Points must be positive numbers' },
        { status: 400 }
      );
    }

    if (numMax < numMin) {
      return NextResponse.json(
        { error: 'Max points must be greater than or equal to min points' },
        { status: 400 }
      );
    }

    if (numDecay < 0) {
      return NextResponse.json(
        { error: 'Decay factor cannot be negative' },
        { status: 400 }
      );
    }

    if (attachmentUrl && !/^https?:\/\//i.test(attachmentUrl.trim())) {
      return NextResponse.json(
        { error: 'Attachment URL must start with http:// or https://' },
        { status: 400 }
      );
    }

    const [newChallenge] = await db
      .insert(challenges)
      .values({
        title: title.trim(),
        description: description.trim(),
        flag: flag.trim(),
        categoryId,
        maxPoints: Number(maxPoints),
        minPoints: Number(minPoints),
        decayFactor: Number(decayFactor),
        status: status === 'published' ? 'published' : 'draft',
        attachmentUrl: attachmentUrl ? attachmentUrl.trim() : null,
      })
      .returning();

    return NextResponse.json({ success: true, challenge: newChallenge });
  } catch (error: any) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
