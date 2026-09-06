import { NextResponse } from 'next/server';
import { db, users, solves } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function GET() {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allSolves = await db.select().from(solves);

    const userStats = new Map<string, { solvesCount: number; totalScore: number }>();
    for (const s of allSolves) {
      const current = userStats.get(s.userId) || { solvesCount: 0, totalScore: 0 };
      current.solvesCount += 1;
      current.totalScore += s.pointsAwarded;
      userStats.set(s.userId, current);
    }

    const data = allUsers.map((u) => {
      const stats = userStats.get(u.id) || { solvesCount: 0, totalScore: 0 };
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        banned: u.banned,
        solvesCount: stats.solvesCount,
        totalScore: stats.totalScore,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ players: data });
  } catch (error: any) {
    console.error('Admin players error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, banned, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Protect against self-banning or self-demoting
    if (userId === admin.id) {
      if (banned === true) {
        return NextResponse.json({ error: 'You cannot ban your own account' }, { status: 400 });
      }
      if (role === 'player') {
        return NextResponse.json({ error: 'You cannot demote yourself from admin' }, { status: 400 });
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(banned !== undefined && { banned: Boolean(banned) }),
        ...(role !== undefined && { role: role === 'admin' ? 'admin' : 'player' }),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, player: updated });
  } catch (error: any) {
    console.error('Update player error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const [deleted] = await db.delete(users).where(eq(users.id, userId)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete player error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
