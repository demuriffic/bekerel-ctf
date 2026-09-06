'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import {
  ArrowLeft,
  Shield,
  Flame,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  currentPoints: number;
  maxPoints: number;
  minPoints: number;
  decayFactor: number;
  solveCount: number;
  status: string;
  attachmentUrl: string | null;
  isSolved: boolean;
}

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    pointsAwarded?: number;
  } | null>(null);

  const fetchChallenge = () => {
    fetch(`/api/challenges/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load challenge');
        return res.json();
      })
      .then((data) => {
        setChallenge(data.challenge);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || submitting) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, flag }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          type: 'error',
          message: data.error || 'Submission failed',
        });
        return;
      }

      if (data.success) {
        setResult({
          type: 'success',
          message: data.message,
          pointsAwarded: data.pointsAwarded,
        });
        setFlag('');
        fetchChallenge(); // Refresh challenge to show solved state
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Incorrect flag. Try again!',
        });
      }
    } catch (err: any) {
      setResult({
        type: 'error',
        message: err.message || 'Error communicating with server',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center font-mono-code text-gray-500 animate-pulse">
        DECRYPTING CHALLENGE PAYLOAD...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
        <div className="text-red-400 font-mono-code">CHALLENGE NOT FOUND OR OFFLINE</div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-sm text-[#00ff41] hover:underline font-mono-code"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Challenge Arena</span>
        </Link>
      </div>
    );
  }

  const renderedDescription = marked.parse(challenge.description || '');

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
                  borderColor: `${challenge.categoryColor}50`,
                  backgroundColor: `${challenge.categoryColor}15`,
                  color: challenge.categoryColor,
                }}
              >
                {challenge.categoryName}
              </span>

              {challenge.isSolved && (
                <span className="px-2.5 py-0.5 rounded text-xs font-mono-code font-semibold bg-[#00ff41]/20 border border-[#00ff41]/40 text-[#00ff41] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
              {challenge.currentPoints}{' '}
              <span className="text-xs text-gray-400 font-normal">PTS</span>
            </div>
            <div className="text-xs font-mono-code text-gray-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{challenge.solveCount} {challenge.solveCount === 1 ? 'solve' : 'solves'}</span>
            </div>
          </div>
        </div>

        {/* Challenge Description (Markdown) */}
        <div className="space-y-4">
          <div className="text-xs font-mono-code text-gray-400 uppercase tracking-wider">
            MISSION BRIEFING:
          </div>
          <div
            className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans [&>p]:mb-4 [&>pre]:bg-[#080d0b] [&>pre]:p-4 [&>pre]:rounded [&>pre]:border [&>pre]:border-[#1a3026] [&>pre]:font-mono-code [&>code]:text-[#00ff41] [&>code]:bg-[#13241d] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: renderedDescription as string }}
          />
        </div>

        {/* Attachment URL */}
        {challenge.attachmentUrl && (
          <div className="pt-2">
            <a
              href={challenge.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] text-xs font-mono-code text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download / Access Resources</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          </div>
        )}

        {/* Flag Submission Area */}
        <div className="border-t border-[#1a3026] pt-6 space-y-4">
          {challenge.isSolved ? (
            <div className="p-4 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/40 flex items-center gap-3 text-sm text-[#00ff41] font-mono-code shadow-[0_0_15px_rgba(0,255,65,0.15)]">
              <CheckCircle2 className="w-5 h-5 text-[#00ff41] shrink-0" />
              <div>
                <span className="font-bold">FLAG CAPTURED!</span> You have successfully solved this challenge.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono-code text-gray-400 uppercase">
                  SUBMIT CAPTURED FLAG
                </label>
                <span className="text-[11px] font-mono-code text-gray-500">
                  Rate limit: 10 attempts / min
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="flag{...}"
                  className="flex-1 px-4 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] font-mono-code transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting || !flag.trim()}
                  className="px-6 py-2.5 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.35)] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'VALIDATING...' : 'SUBMIT'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Submission Result Notification */}
          {result && (
            <div
              className={`p-4 rounded border text-xs font-mono-code flex items-start gap-2.5 ${
                result.type === 'success'
                  ? 'bg-[#00ff41]/10 border-[#00ff41]/40 text-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              {result.type === 'success' ? (
                <Sparkles className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>{result.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
