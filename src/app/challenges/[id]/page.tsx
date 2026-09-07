import Link from 'next/link';
import { db, challenges, categories, solves } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { getCtfStatus } from '@/lib/ctf';
import { calculateDynamicPoints } from '@/lib/scoring';
import { renderMarkdown } from '@/lib/markdown';
import { initDb } from '@/db/migrate';
import FlagSubmitForm from '@/components/FlagSubmitForm';
import {
  ArrowLeft,
  Flame,
  Download,
  ExternalLink,
  PauseCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await initDb();
  const { id } = await params;
  const session = await getSession();
  const isAdmin = Boolean(session && session.role === 'admin');

  const [challenge, ctfStatus] = await Promise.all([
    db.select().from(challenges).where(eq(challenges.id, id)).limit(1).then((r) => r[0]),
    getCtfStatus(),
  ]);

  // If CTF is paused and user is not admin, completely block challenge access
  if (ctfStatus.isPaused && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-xl border border-amber-500/30 bg-[#0d1613] text-center space-y-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <PauseCircle className="w-12 h-12 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold font-mono-code text-white">
              COMPETITION PAUSED
            </h1>
            <p className="text-sm text-gray-400 font-mono-code">
              Challenges cannot be viewed or submitted while the competition is paused.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-[#00ff41] hover:border-[#00ff41]/50 font-mono-code transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Challenges</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
        <div className="text-red-400 font-mono-code">Challenge not found</div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-sm text-[#00ff41] hover:underline font-mono-code"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challenges</span>
        </Link>
      </div>
    );
  }

  if (challenge.status !== 'published' && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
        <div className="text-red-400 font-mono-code">Challenge not available</div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-sm text-[#00ff41] hover:underline font-mono-code"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challenges</span>
        </Link>
      </div>
    );
  }

  // Prerequisite check: If not admin, the challenge is hidden until prerequisite is solved
  if (challenge.prerequisiteId && !isAdmin) {
    if (!session) {
      return (
        <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <div className="text-red-400 font-mono-code">Challenge not found</div>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 text-sm text-[#00ff41] hover:underline font-mono-code"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Challenges</span>
          </Link>
        </div>
      );
    }

    const [prereqSolve] = await db
      .select({ id: solves.id })
      .from(solves)
      .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.prerequisiteId)))
      .limit(1);

    if (!prereqSolve) {
      return (
        <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <div className="text-red-400 font-mono-code">Challenge not found</div>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 text-sm text-[#00ff41] hover:underline font-mono-code"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Challenges</span>
          </Link>
        </div>
      );
    }
  }

  const [category, [solveCountRow], userSolve] = await Promise.all([
    db.select().from(categories).where(eq(categories.id, challenge.categoryId)).limit(1).then((r) => r[0]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(solves)
      .where(eq(solves.challengeId, challenge.id)),
    session
      ? db
          .select({ id: solves.id })
          .from(solves)
          .where(and(eq(solves.userId, session.id), eq(solves.challengeId, challenge.id)))
          .limit(1)
          .then((r) => r[0])
      : Promise.resolve(null),
  ]);

  const solveCount = solveCountRow?.count || 0;
  const currentPoints = calculateDynamicPoints(
    challenge.maxPoints,
    challenge.minPoints,
    challenge.decayFactor,
    solveCount
  );

  const renderedDescription = renderMarkdown(challenge.description || '');
  const isSafeAttachmentUrl = challenge.attachmentUrl && /^https?:\/\//i.test(challenge.attachmentUrl);
  const isSolved = Boolean(userSolve);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/challenges"
        className="inline-flex items-center gap-2 text-xs font-mono-code text-gray-400 hover:text-[#00ff41] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Challenges</span>
      </Link>

      {/* Main Challenge Card */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613]/90 shadow-2xl backdrop-blur-md space-y-6">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded text-xs font-mono-code font-semibold border"
                style={{
                  borderColor: `${category?.color || '#00ff41'}50`,
                  backgroundColor: `${category?.color || '#00ff41'}15`,
                  color: category?.color || '#00ff41',
                }}
              >
                {category?.name || 'General'}
              </span>

              {isSolved && (
                <span className="px-2.5 py-0.5 rounded text-xs font-mono-code font-semibold bg-[#00ff41]/20 border border-[#00ff41]/40 text-[#00ff41] flex items-center gap-1">
                  <span>SOLVED</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono-code text-white">
              {challenge.title}
            </h1>
          </div>

          <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 border-[#1a3026] pt-3 sm:pt-0">
            <div className="text-3xl font-extrabold font-mono-code text-[#00ff41]">
              {currentPoints}{' '}
              <span className="text-xs text-gray-400 font-normal">PTS</span>
            </div>
            <div className="text-xs font-mono-code text-gray-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{solveCount} {solveCount === 1 ? 'solve' : 'solves'}</span>
            </div>
          </div>
        </div>

        {/* Challenge Description (Markdown) */}
        <div className="space-y-4">
          <div className="text-xs font-mono-code text-gray-400 uppercase tracking-wider">
            Description:
          </div>
          <div
            className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans [&>p]:mb-4 [&>pre]:bg-[#080d0b] [&>pre]:p-4 [&>pre]:rounded [&>pre]:border [&>pre]:border-[#1a3026] [&>pre]:font-mono-code [&>code]:text-[#00ff41] [&>code]:bg-[#13241d] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: renderedDescription as string }}
          />
        </div>

        {/* Attachment URL */}
        {isSafeAttachmentUrl && (
          <div className="pt-2">
            <a
              href={challenge.attachmentUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] text-xs font-mono-code text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Attachment</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          </div>
        )}

        {/* Flag Submission Area (Island) */}
        <FlagSubmitForm
          challengeId={challenge.id}
          isSolved={isSolved}
          isPaused={ctfStatus.isPaused}
        />
      </div>
    </div>
  );
}
