import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

const rawSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'super-secret-ctf-key-change-in-production-2026';
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET && !process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] AUTH_SECRET or JWT_SECRET is not configured! Using fallback key.');
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

const COOKIE_NAME = 'ctf_session';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'admin';
  banned: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    banned: user.banned,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as 'player' | 'admin',
      banned: Boolean(payload.banned),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  await initDb();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Verify user still exists and check ban status in DB
  const [dbUser] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!dbUser || dbUser.banned) {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role as 'player' | 'admin',
    banned: dbUser.banned,
  };
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session;
}

