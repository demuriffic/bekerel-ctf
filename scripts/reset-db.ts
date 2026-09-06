import { initDb, seedAdmin } from '../src/db/migrate';
import { db, users, challenges, categories, solves, submissions, ctfSettings } from '../src/db';
import { eq, ne } from 'drizzle-orm';

async function resetDatabase() {
  const isCompetitionOnly = process.argv.includes('--competition');

  if (isCompetitionOnly) {
    console.log('=== INITIATING COMPETITION ROUND RESET (PRESERVING CHALLENGES & ACCOUNTS) ===\n');
    await initDb();

    console.log('1. Purging all competitor solves...');
    await db.delete(solves);

    console.log('2. Purging all submission audit logs...');
    await db.delete(submissions);

    console.log('3. Unpausing CTF competition...');
    await db
      .update(ctfSettings)
      .set({ isPaused: false })
      .where(eq(ctfSettings.id, 1));

    console.log('\n✅ COMPETITION ROUND RESET COMPLETE.');
    console.log('   - All solves & submissions purged');
    console.log('   - Leaderboard reset to 0');
    console.log('   - Challenges, categories, and player accounts preserved');
    console.log('   - Competition status set to UNPAUSED');
    return;
  }

  console.log('=== INITIATING FULL FACTORY RESET ===\n');

  await initDb();

  console.log('1. Purging all competitor solves...');
  await db.delete(solves);

  console.log('2. Purging all submission audit logs...');
  await db.delete(submissions);

  console.log('3. Purging non-admin player accounts...');
  await db.delete(users).where(ne(users.role, 'admin'));

  console.log('4. Purging custom challenges and categories...');
  await db.delete(challenges);
  await db.delete(categories);

  console.log('5. Resetting CTF competition lifecycle window...');
  await db
    .update(ctfSettings)
    .set({
      startTime: null,
      endTime: null,
      isPaused: false,
    })
    .where(eq(ctfSettings.id, 1));

  console.log('6. Re-seeding default administrator and starter challenges...');
  await seedAdmin();

  console.log('\n✅ CTF PLATFORM HAS BEEN RESET TO INITIAL FACTORY STATE.');
  console.log('   - Administrator preserved');
  console.log('   - 5 default categories restored');
  console.log('   - Starter challenges restored');
  console.log('   - Scoreboard and Solves set to 0');
  console.log('   - Status set to ACTIVE (unpaused)');
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
