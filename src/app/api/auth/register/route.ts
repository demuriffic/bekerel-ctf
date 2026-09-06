import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq, or } from 'drizzle-orm';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 24) {
      return NextResponse.json({ error: 'Username must be between 3 and 24 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain alphanumeric characters, underscores, and dashes' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, trimmedUsername), eq(users.email, trimmedEmail)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].username.toLowerCase() === trimmedUsername.toLowerCase()) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash,
        role: 'player',
        banned: false,
      })
      .returning();

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role as 'player' | 'admin',
      banned: newUser.banned,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
