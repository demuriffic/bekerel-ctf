import { NextResponse } from 'next/server';
import { db, challenges, solves, submissions } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { calculateDynamicPoints } from '@/lib/scoring';
import { getCtfStatus } from '@/lib/ctf';
import { initDb } from '@/db/migrate';

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

    // Rate limiting: 10 attempts per minute per challenge per user
    const rateLimitKey = `submit:${session.id}:${challengeId}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 60000);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil(rateCheck.resetInMs / 1000);
      return NextResponse.json(
        { error: `Too many submissions. Please wait ${waitSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    // Check CTF status
    const ctfStatus = await getCtfStatus();
    if (session.role !== 'admin') {
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

    // Check flag
    const isCorrect = trimmedFlag === challenge.flag.trim();

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

    // Record the solve
    await db.insert(solves).values({
      userId: session.id,
      challengeId: challenge.id,
      pointsAwarded,
    });

    return NextResponse.json({
      success: true,
      message: `🎉 Correct flag! You solved "${challenge.title}" and earned ${pointsAwarded} points!`,
      pointsAwarded,
      isFirstBlood: currentSolveCount === 0,
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
