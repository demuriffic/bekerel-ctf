import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, challenges, solves, submissions } from '@/db';
import { eq, and, sql, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateDynamicPoints } from '@/lib/scoring';
import { getCtfStatus } from '@/lib/ctf';
import { initDb } from '@/db/migrate';

function timingSafeFlagMatch(submitted: string, actual: string): boolean {
  const hashA = crypto.createHash('sha256').update(submitted).digest();
  const hashB = crypto.createHash('sha256').update(actual).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(req: Request) {
  try {
    await initDb();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to submit a flag' }, { status: 401 });
    }

    if (session.banned) {
      return NextResponse.json({ error: 'Your account is banned from participating' }, { status: 403 });
    }

    const body = await req.json();
    const { challengeId, flag } = body;

    if (!challengeId || typeof flag !== 'string') {
      return NextResponse.json({ error: 'Challenge ID and flag are required' }, { status: 400 });
    }

    const trimmedFlag = flag.trim();
    if (!trimmedFlag) {
      return NextResponse.json({ error: 'Flag cannot be empty' }, { status: 400 });
    }

    // Rate limiting: In-memory fast layer
    const rateLimitKey = `submit:${session.id}:${challengeId}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 60000);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil(rateCheck.resetInMs / 1000);
      return NextResponse.json(
        { error: `Too many submissions. Please wait ${waitSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    // Rate limiting: Persistent database layer across serverless instances (10 per 60s)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [recentDbSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, session.id),
          eq(submissions.challengeId, challengeId),
          gte(submissions.submittedAt, oneMinuteAgo)
        )
      );

    if ((recentDbSubmissions?.count || 0) >= 10) {
      return NextResponse.json(
        { error: 'Too many submissions. Rate limit is 10 attempts per minute. Please wait.' },
        { status: 429 }
      );
    }

    // Check CTF status
    const ctfStatus = await getCtfStatus();
    if (session.role !== 'admin') {
      if (ctfStatus.isPaused) {
        return NextResponse.json(
          { error: 'The CTF competition is currently PAUSED by administrators. Submissions are temporarily suspended.' },
          { status: 403 }
        );
      }
      if (!ctfStatus.hasStarted) {
        return NextResponse.json({ error: 'The CTF competition has not started yet.' }, { status: 403 });
      }
      if (ctfStatus.hasEnded) {
        return NextResponse.json({ error: 'The CTF competition has ended. Submissions are closed.' }, { status: 403 });
      }
    }

    // Fetch challenge
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.status !== 'published' && session.role !== 'admin') {
      return NextResponse.json({ error: 'This challenge is not currently available' }, { status: 404 });
    }

    // Check prerequisite access
    if (challenge.prerequisiteId && session.role !== 'admin') {
      const [prereqSolve] = await db
        .select({ id: solves.id })
        .from(solves)
        .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.prerequisiteId)))
        .limit(1);

      if (!prereqSolve) {
        return NextResponse.json(
          { error: 'This challenge is locked because its prerequisite has not been solved.' },
          { status: 403 }
        );
      }
    }

    // Check if user already solved it
    const [existingSolve] = await db
      .select()
      .from(solves)
      .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challengeId)))
      .limit(1);

    if (existingSolve) {
      return NextResponse.json(
        { error: 'You have already solved this challenge!', alreadySolved: true },
        { status: 400 }
      );
    }

    // Check flag with constant-time comparison
    const isCorrect = timingSafeFlagMatch(trimmedFlag, challenge.flag.trim());

    // Log the submission attempt in audit log
    await db.insert(submissions).values({
      userId: session.id,
      challengeId: challenge.id,
      submittedFlag: trimmedFlag,
      correct: isCorrect,
    });

    if (!isCorrect) {
      return NextResponse.json({
        success: false,
        message: 'Incorrect flag. Check your answer and try again!',
      });
    }

    // Correct flag! Calculate dynamic points
    const solveCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(solves)
      .where(eq(solves.challengeId, challenge.id));

    const currentSolveCount = solveCountResult[0]?.count || 0;
    const pointsAwarded = calculateDynamicPoints(
      challenge.maxPoints,
      challenge.minPoints,
      challenge.decayFactor,
      currentSolveCount
    );

    // Record the solve with graceful concurrent double-solve constraint handling
    try {
      await db.insert(solves).values({
        userId: session.id,
        challengeId: challenge.id,
        pointsAwarded,
      });
    } catch (insertError: any) {
      if (
        insertError?.code === '23505' ||
        String(insertError?.message || '').toLowerCase().includes('unique') ||
        String(insertError?.message || '').toLowerCase().includes('duplicate')
      ) {
        return NextResponse.json(
          { error: 'You have already solved this challenge!', alreadySolved: true },
          { status: 400 }
        );
      }
      throw insertError;
    }

    // Find any published challenges newly unlocked by solving this prerequisite
    const unlockedChallenges = await db
      .select({ id: challenges.id, title: challenges.title })
      .from(challenges)
      .where(and(eq(challenges.prerequisiteId, challenge.id), eq(challenges.status, 'published')));

    return NextResponse.json({
      success: true,
      message: `🎉 Correct flag! You solved "${challenge.title}" and earned ${pointsAwarded} points!`,
      pointsAwarded,
      isFirstBlood: currentSolveCount === 0,
      unlockedChallenges,
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
