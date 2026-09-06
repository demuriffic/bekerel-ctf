import { NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq, or } from 'drizzle-orm';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { initDb } from '@/db/migrate';

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    const trimmedLogin = login.trim();

    // Query user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, trimmedLogin.toLowerCase()), eq(users.username, trimmedLogin)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.banned) {
      return NextResponse.json({ error: 'Your account has been suspended by an administrator' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'player' | 'admin',
      banned: user.banned,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
