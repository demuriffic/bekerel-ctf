import { getDb } from './index';
import bcrypt from 'bcryptjs';

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#00ff41',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  flag TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  max_points INTEGER NOT NULL DEFAULT 500,
  min_points INTEGER NOT NULL DEFAULT 100,
  decay_factor INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'draft',
  attachment_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  solved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  points_awarded INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_challenge_idx ON solves(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS solves_challenge_idx ON solves(challenge_id);
CREATE INDEX IF NOT EXISTS solves_user_idx ON solves(user_id);
CREATE INDEX IF NOT EXISTS challenges_cat_idx ON challenges(category_id);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  submitted_flag TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_user_chal_idx ON submissions(user_id, challenge_id, submitted_at);

CREATE TABLE IF NOT EXISTS ctf_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_paused BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE ctf_settings ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT false;
`;

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initDb() {
  if (initialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

        if (connectionString && !connectionString.includes('memory') && !connectionString.includes('localhost:0')) {
          const { neon } = require('@neondatabase/serverless');
          const sql = neon(connectionString);
          // Split and execute SQL statements
          const statements = INIT_SQL.split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          for (const statement of statements) {
            if (typeof sql.query === 'function') {
              await sql.query(statement);
            } else {
              await sql(statement);
            }
          }
        } else {
          const { PGlite } = require('@electric-sql/pglite');
          const path = require('path');
          const fs = require('fs');
          const dbPath = path.join(process.cwd(), '.local_db');
          if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
          }
          const client = new PGlite(dbPath);
          await client.exec(INIT_SQL);
        }

        // Seed default admin if ADMIN_EMAIL is set
        await seedAdmin();

        initialized = true;
      } catch (err) {
        initPromise = null; // Allow retry on failure
        throw err;
      }
    })();
  }

  return initPromise;
}

export async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ctf.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  const { users, categories, challenges, ctfSettings } = require('./schema');
  const { eq } = require('drizzle-orm');
  const db = getDb();

  try {
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.insert(users).values({
        email: adminEmail,
        username: adminUsername,
        passwordHash,
        role: 'admin',
        banned: false,
      });
      console.log(`[SEED] Default admin created: ${adminEmail} / ${adminPassword}`);
    }

    // Ensure CTF settings row exists
    const settings = await db.select().from(ctfSettings).where(eq(ctfSettings.id, 1));
    if (settings.length === 0) {
      await db.insert(ctfSettings).values({ id: 1 });
    }

    // Seed initial categories and challenges if none exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { name: 'Web Exploitation', color: '#00ff41', order: 1 },
        { name: 'Cryptography', color: '#00e5ff', order: 2 },
        { name: 'Reverse Engineering', color: '#e040fb', order: 3 },
        { name: 'Forensics', color: '#ffd600', order: 4 },
        { name: 'Miscellaneous', color: '#ff5252', order: 5 },
      ]);

      const freshCats = await db.select().from(categories);
      const webCat = freshCats.find((c) => c.name === 'Web Exploitation') || freshCats[0];
      const cryptoCat = freshCats.find((c) => c.name === 'Cryptography') || freshCats[1];

      await db.insert(challenges).values([
        {
          title: 'Source Sleuth',
          description: `Welcome to the CTF! Let's start with a warm-up.

Inspect the HTML page comments or check out the developer tools to find where the flag is hidden.

Flag format: \`flag{...}\``,
          flag: 'flag{welcome_to_the_matrix_2026}',
          categoryId: webCat.id,
          maxPoints: 500,
          minPoints: 100,
          decayFactor: 50,
          status: 'published',
          attachmentUrl: 'https://example.com/starter-kit.zip',
        },
        {
          title: 'Caesar Cipher Reloaded',
          description: `We intercepted this ciphertext from an ancient legion:

\`iodj{fdbhdu_flskhu_lv_fodvvlf}\`

Can you decrypt the hidden message?`,
          flag: 'flag{caesar_cipher_is_classic}',
          categoryId: cryptoCat.id,
          maxPoints: 500,
          minPoints: 100,
          decayFactor: 50,
          status: 'published',
        },
      ]);
      console.log('[SEED] Default categories and starter challenges created');
    }
  } catch (error) {
    console.error('[SEED] Error during seeding:', error);
  }
}
