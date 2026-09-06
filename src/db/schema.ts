import { pgTable, text, timestamp, boolean, integer, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('player'), // 'player' | 'admin'
  banned: boolean('banned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#00ff41'),
  order: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  flag: text('flag').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  maxPoints: integer('max_points').notNull().default(500),
  minPoints: integer('min_points').notNull().default(100),
  decayFactor: integer('decay_factor').notNull().default(50),
  status: text('status').notNull().default('draft'), // 'draft' | 'published'
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const solves = pgTable(
  'solves',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
    solvedAt: timestamp('solved_at').notNull().defaultNow(),
    pointsAwarded: integer('points_awarded').notNull(),
  },
  (table) => [
    uniqueIndex('user_challenge_idx').on(table.userId, table.challengeId),
  ]
);

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  submittedFlag: text('submitted_flag').notNull(),
  correct: boolean('correct').notNull(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

export const ctfSettings = pgTable('ctf_settings', {
  id: integer('id').primaryKey().default(1),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type Solve = typeof solves.$inferSelect;
export type NewSolve = typeof solves.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type CtfSettings = typeof ctfSettings.$inferSelect;
