import { NextResponse } from 'next/server';
import { db, categories } from '@/db';
import { eq, and, ne, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, color, order } = body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 });
      }

      const duplicate = await db
        .select()
        .from(categories)
        .where(
          and(
            sql`lower(${categories.name}) = lower(${trimmedName})`,
            ne(categories.id, id)
          )
        )
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: 'Another category with this name already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color: color.trim() }),
        ...(order !== undefined && { order: Number(order) }),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
