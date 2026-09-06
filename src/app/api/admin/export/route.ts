import { NextResponse } from 'next/server';
import { db, users, challenges, categories, solves, submissions } from '@/db';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/db/migrate';

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  try {
    await initDb();
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'full';

    const allUsers = await db.select().from(users);
    const allChallenges = await db.select().from(challenges);
    const allCategories = await db.select().from(categories);
    const allSolves = await db.select().from(solves).orderBy(desc(solves.solvedAt));
    const allSubmissions = await db.select().from(submissions).orderBy(desc(submissions.submittedAt));

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const challengeMap = new Map(allChallenges.map((c) => [c.id, c]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    if (format === 'csv') {
      if (type === 'scoreboard') {
        const userScores = new Map<string, { score: number; count: number }>();
        for (const s of allSolves) {
          const u = userScores.get(s.userId) || { score: 0, count: 0 };
          u.score += s.pointsAwarded;
          u.count += 1;
          userScores.set(s.userId, u);
        }

        const sorted = allUsers
          .filter((u) => !u.banned)
          .map((u) => {
            const stats = userScores.get(u.id) || { score: 0, count: 0 };
            return {
              username: u.username,
              email: u.email,
              role: u.role,
              score: stats.score,
              solves: stats.count,
            };
          })
          .sort((a, b) => b.score - a.score);

        const rows = ['Rank,Username,Email,Role,Score,Solves'];
        sorted.forEach((item, idx) => {
          rows.push(
            [idx + 1, escapeCsv(item.username), escapeCsv(item.email), item.role, item.score, item.solves].join(',')
          );
        });

        return new Response(rows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ctf-scoreboard.csv"',
          },
        });
      }

      if (type === 'solves') {
        const rows = ['ID,Username,Email,Challenge,Category,Points Awarded,Solved At'];
        for (const s of allSolves) {
          const user = userMap.get(s.userId);
          const challenge = challengeMap.get(s.challengeId);
          const category = challenge ? categoryMap.get(challenge.categoryId) : null;
          rows.push(
            [
              s.id,
              escapeCsv(user?.username),
              escapeCsv(user?.email),
              escapeCsv(challenge?.title),
              escapeCsv(category?.name),
              s.pointsAwarded,
              s.solvedAt.toISOString(),
            ].join(',')
          );
        }

        return new Response(rows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ctf-solves.csv"',
          },
        });
      }

      if (type === 'submissions') {
        const rows = ['ID,Username,Email,Challenge,Category,Submitted Flag,Correct,Submitted At'];
        for (const s of allSubmissions) {
          const user = userMap.get(s.userId);
          const challenge = challengeMap.get(s.challengeId);
          const category = challenge ? categoryMap.get(challenge.categoryId) : null;
          rows.push(
            [
              s.id,
              escapeCsv(user?.username),
              escapeCsv(user?.email),
              escapeCsv(challenge?.title),
              escapeCsv(category?.name),
              escapeCsv(s.submittedFlag),
              s.correct ? 'YES' : 'NO',
              s.submittedAt.toISOString(),
            ].join(',')
          );
        }

        return new Response(rows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="ctf-submissions.csv"',
          },
        });
      }

      // Default CSV: challenges
      const rows = ['ID,Title,Category,Flag,Max Points,Min Points,Decay Factor,Status,Attachment URL,Created At'];
      for (const c of allChallenges) {
        const cat = categoryMap.get(c.categoryId);
        rows.push(
          [
            c.id,
            escapeCsv(c.title),
            escapeCsv(cat?.name),
            escapeCsv(c.flag),
            c.maxPoints,
            c.minPoints,
            c.decayFactor,
            c.status,
            escapeCsv(c.attachmentUrl),
            c.createdAt.toISOString(),
          ].join(',')
        );
      }

      return new Response(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ctf-challenges.csv"',
        },
      });
    }

    // JSON export
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      users: allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        banned: u.banned,
        createdAt: u.createdAt.toISOString(),
      })),
      categories: allCategories,
      challenges: allChallenges,
      solves: allSolves.map((s) => ({
        id: s.id,
        userId: s.userId,
        username: userMap.get(s.userId)?.username,
        challengeId: s.challengeId,
        challengeTitle: challengeMap.get(s.challengeId)?.title,
        pointsAwarded: s.pointsAwarded,
        solvedAt: s.solvedAt.toISOString(),
      })),
      submissions: allSubmissions.map((s) => ({
        id: s.id,
        userId: s.userId,
        username: userMap.get(s.userId)?.username,
        challengeId: s.challengeId,
        challengeTitle: challengeMap.get(s.challengeId)?.title,
        submittedFlag: s.submittedFlag,
        correct: s.correct,
        submittedAt: s.submittedAt.toISOString(),
      })),
    };

    return new Response(JSON.stringify(exportBundle, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ctf-export-full.json"',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
