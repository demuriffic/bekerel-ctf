import { NextResponse } from 'next/server';
import { db, challenges } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET(
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
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ challenge });
  } catch (error: any) {
    console.error('Admin get challenge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

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
    const {
      title,
      description,
      flag,
      categoryId,
      maxPoints,
      minPoints,
      decayFactor,
      status,
      attachmentUrl,
    } = body;

    if (maxPoints !== undefined && minPoints !== undefined) {
      const numMax = Number(maxPoints);
      const numMin = Number(minPoints);
      if (isNaN(numMax) || isNaN(numMin) || numMin <= 0 || numMax < numMin) {
        return NextResponse.json(
          { error: 'Invalid points: Max points must be >= min points > 0' },
          { status: 400 }
        );
      }
    }

    if (decayFactor !== undefined && Number(decayFactor) < 0) {
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

    const [updated] = await db
      .update(challenges)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(flag !== undefined && { flag: flag.trim() }),
        ...(categoryId !== undefined && { categoryId }),
        ...(maxPoints !== undefined && { maxPoints: Number(maxPoints) }),
        ...(minPoints !== undefined && { minPoints: Number(minPoints) }),
        ...(decayFactor !== undefined && { decayFactor: Number(decayFactor) }),
        ...(status !== undefined && { status: status === 'published' ? 'published' : 'draft' }),
        ...(attachmentUrl !== undefined && { attachmentUrl: attachmentUrl ? attachmentUrl.trim() : null }),
        updatedAt: new Date(),
      })
      .where(eq(challenges.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, challenge: updated });
  } catch (error: any) {
    console.error('Update challenge error:', error);
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
    const [deleted] = await db.delete(challenges).where(eq(challenges.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete challenge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
