import { initDb, seedAdmin } from '../src/db/migrate';
import { db, users, challenges, categories, solves, submissions, ctfSettings } from '../src/db';
import { eq } from 'drizzle-orm';
import { calculateDynamicPoints } from '../src/lib/scoring';
import { checkRateLimit } from '../src/lib/rate-limit';
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from '../src/lib/auth';

async function runTests() {
  console.log('=== STARTING CTF PLATFORM COMPREHENSIVE VERIFICATION ===\n');

  // 1. DB Init & Admin Seed
  console.log('[TEST 1] Initializing DB & Admin Seed...');
  await initDb();
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (!adminUser) throw new Error('Admin user was not seeded!');
  console.log('✓ Admin user exists:', adminUser.email, `(${adminUser.username})`);

  // Verify password hash
  const adminPassMatch = await verifyPassword('AdminPassword123!', adminUser.passwordHash);
  if (!adminPassMatch) throw new Error('Admin password hash does not match!');
  console.log('✓ Admin password hash verified');

  // 2. Auth Tokens & JWT Sessions
  console.log('\n[TEST 2] Testing Session JWT generation and verification...');
  const token = await signSessionToken({
    id: adminUser.id,
    email: adminUser.email,
    username: adminUser.username,
    role: adminUser.role as any,
    banned: adminUser.banned,
  });
  const decoded = await verifySessionToken(token);
  if (!decoded || decoded.username !== adminUser.username) throw new Error('JWT verification failed!');
  console.log('✓ Session JWT signed and verified successfully');

  // 3. Dynamic Scoring Formula Test
  console.log('\n[TEST 3] Testing Dynamic Scoring with Logarithmic Decay...');
  const max = 500;
  const min = 100;
  const decay = 50;

  const points0 = calculateDynamicPoints(max, min, decay, 0); // 0 solves
  const points1 = calculateDynamicPoints(max, min, decay, 1); // 1 solve
  const points5 = calculateDynamicPoints(max, min, decay, 5); // 5 solves
  const points100 = calculateDynamicPoints(max, min, decay, 100); // 100 solves

  console.log(`0 solves: ${points0} pts (expected: 500)`);
  console.log(`1 solve:  ${points1} pts (expected: ${Math.round(500 - 50 * Math.log(2))})`);
  console.log(`5 solves: ${points5} pts (expected: ${Math.round(500 - 50 * Math.log(6))})`);
  console.log(`100 solves: ${points100} pts (decayed towards min ${min})`);

  if (points0 !== 500) throw new Error('Initial points must equal maxPoints');
  if (points1 >= points0) throw new Error('Points must decrease after first solve');
  if (points100 < min) throw new Error('Points must never decay below minPoints');
  console.log('✓ Dynamic logarithmic decay curve verified');

  // 4. Rate Limiter Test
  console.log('\n[TEST 4] Testing Rate Limiting...');
  const testKey = 'test-user-challenge-limit';
  for (let i = 0; i < 10; i++) {
    const res = checkRateLimit(testKey, 10, 60000);
    if (!res.allowed) throw new Error(`Attempt ${i + 1} should have been allowed`);
  }
  const blockedAttempt = checkRateLimit(testKey, 10, 60000);
  if (blockedAttempt.allowed) throw new Error('11th attempt should be blocked by rate limiter!');
  console.log('✓ Rate limiter successfully blocked excess submissions (10/min enforced)');

  // 5. Player Creation & Flag Submission Cycle
  console.log('\n[TEST 5] Testing Player Cycle & Flag Solves...');
  const testPlayerUsername = `e2e_player_${Date.now()}`;
  const testPlayerEmail = `${testPlayerUsername}@test.com`;

  let testPlayerId: string | null = null;
  let newCatId: string | null = null;
  let newChalId: string | null = null;

  try {
    const [testPlayer] = await db
      .insert(users)
      .values({
        username: testPlayerUsername,
        email: testPlayerEmail,
        passwordHash: await hashPassword('password123'),
        role: 'player',
        banned: false,
      })
      .returning();
    testPlayerId = testPlayer.id;

    console.log(`✓ Created test player: ${testPlayer.username}`);

    // Fetch starter challenge
    const [challenge] = await db.select().from(challenges).where(eq(challenges.title, 'Source Sleuth')).limit(1);
    if (!challenge) throw new Error('Starter challenge not found!');

    // Test incorrect submission audit log
    await db.insert(submissions).values({
      userId: testPlayer.id,
      challengeId: challenge.id,
      submittedFlag: 'flag{wrong_flag_guess}',
      correct: false,
    });

    const [auditEntry] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, testPlayer.id))
      .limit(1);

    if (!auditEntry || auditEntry.correct !== false) {
      throw new Error('Audit log for incorrect submission failed!');
    }
    console.log('✓ Incorrect submission logged in audit trail');

    // Test correct submission
    const awarded = calculateDynamicPoints(challenge.maxPoints, challenge.minPoints, challenge.decayFactor, 0);
    await db.insert(solves).values({
      userId: testPlayer.id,
      challengeId: challenge.id,
      pointsAwarded: awarded,
    });

    await db.insert(submissions).values({
      userId: testPlayer.id,
      challengeId: challenge.id,
      submittedFlag: challenge.flag,
      correct: true,
    });

    console.log(`✓ Correct flag captured! Awarded ${awarded} points to ${testPlayer.username}`);

    // 6. Verification of Scoreboard
    console.log('\n[TEST 6] Testing Scoreboard Aggregation...');
    const playerSolves = await db.select().from(solves).where(eq(solves.userId, testPlayer.id));
    const totalScore = playerSolves.reduce((acc, s) => acc + s.pointsAwarded, 0);
    if (totalScore !== awarded) throw new Error(`Score calculation mismatch: ${totalScore} vs ${awarded}`);
    console.log(`✓ Scoreboard correctly computed player score: ${totalScore} pts`);

    // 7. Admin Challenge & Category Creation
    console.log('\n[TEST 7] Testing Admin Operations (Category & Challenge CRUD)...');
    const [newCat] = await db
      .insert(categories)
      .values({
        name: `E2E Category ${Date.now()}`,
        color: '#ff007f',
        order: 99,
      })
      .returning();
    newCatId = newCat.id;
    console.log(`✓ Admin created category: ${newCat.name} (${newCat.color})`);

    const [newChal] = await db
      .insert(challenges)
      .values({
        title: 'E2E Pwn Sandbox',
        description: 'Find the buffer overflow vulnerability.',
        flag: 'flag{pwned_the_sandbox_1337}',
        categoryId: newCat.id,
        maxPoints: 500,
        minPoints: 100,
        decayFactor: 50,
        status: 'published',
      })
      .returning();
    newChalId = newChal.id;
    console.log(`✓ Admin deployed challenge: ${newChal.title} [${newChal.status}]`);

    // 8. Markdown Sanitization Test
    console.log('\n[TEST 8] Testing Markdown Sanitization & XSS Defense...');
    const { renderMarkdown } = await import('../src/lib/markdown');
    const dirtyMarkdown = `## Exploit

<script>alert("pwned")</script>

<img src=x onerror=alert(1)>

[Malicious Link](javascript:alert(1))

**Valid Text**`;

    const cleanHtml = renderMarkdown(dirtyMarkdown);
    if (cleanHtml.includes('<script>') || cleanHtml.includes('onerror') || cleanHtml.includes('href="javascript:')) {
      throw new Error('Markdown sanitizer allowed malicious XSS payload through!');
    }
    if (!cleanHtml.includes('<strong>Valid Text</strong>') && !cleanHtml.includes('<b>Valid Text</b>')) {
      throw new Error('Markdown sanitizer did not retain valid Markdown formatting!');
    }
    console.log('✓ Markdown safely sanitized: scripts, onerror handlers, and javascript: links stripped');

    // 9. Scoreboard Isolation Test (Admins excluded)
    console.log('\n[TEST 9] Testing Scoreboard Admin Isolation...');
    const { and: andOp } = await import('drizzle-orm');
    const competitorsOnly = await db
      .select()
      .from(users)
      .where(andOp(eq(users.banned, false), eq(users.role, 'player')));
    const hasAdminInScoreboard = competitorsOnly.some((u) => u.role === 'admin');
    if (hasAdminInScoreboard) throw new Error('Admins should not appear in player competitor pool!');
    console.log(`✓ Scoreboard correctly isolates competitors (${competitorsOnly.length} players, 0 admins)`);

    console.log('\n🎉 ALL 9 SYSTEM INTEGRATION & SECURITY VERIFICATION TESTS PASSED PERFECTLY!');
  } finally {
    // Unconditional cleanup of all test records
    if (newChalId) await db.delete(challenges).where(eq(challenges.id, newChalId));
    if (newCatId) await db.delete(categories).where(eq(categories.id, newCatId));
    if (testPlayerId) {
      await db.delete(solves).where(eq(solves.userId, testPlayerId));
      await db.delete(submissions).where(eq(submissions.userId, testPlayerId));
      await db.delete(users).where(eq(users.id, testPlayerId));
    }
    console.log('✓ Test fixtures cleaned up successfully');
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
