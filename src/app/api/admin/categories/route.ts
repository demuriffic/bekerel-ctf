import { NextResponse } from 'next/server';
import { db, categories, challenges } from '@/db';
import { asc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const allCategories = await db.select().from(categories).orderBy(asc(categories.order));
    const allChallenges = await db.select().from(challenges);

    const challengeCounts = new Map<string, number>();
    for (const c of allChallenges) {
      challengeCounts.set(c.categoryId, (challengeCounts.get(c.categoryId) || 0) + 1);
    }

    const data = allCategories.map((cat) => ({
      ...cat,
      challengeCount: challengeCounts.get(cat.id) || 0,
      createdAt: cat.createdAt.toISOString(),
    }));

    return NextResponse.json({ categories: data });
  } catch (error: any) {
    console.error('Admin categories error:', error);
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
    const { name, color = '#00ff41', order = 0 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for duplicate category name (case-insensitive)
    const existing = await db
      .select()
      .from(categories)
      .where(sql`lower(${categories.name}) = lower(${trimmedName})`)
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        color: color.trim() || '#00ff41',
        order: Number(order) || 0,
      })
      .returning();

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
