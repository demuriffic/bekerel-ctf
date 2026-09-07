'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertCircle, Sparkles, Unlock } from 'lucide-react';

interface UnlockedChallenge {
  id: string;
  title: string;
}

interface FlagSubmitFormProps {
  challengeId: string;
  isSolved: boolean;
  isPaused: boolean;
}

export default function FlagSubmitForm({
  challengeId,
  isSolved: initialIsSolved,
  isPaused,
}: FlagSubmitFormProps) {
  const [isSolved, setIsSolved] = useState(initialIsSolved);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    pointsAwarded?: number;
  } | null>(null);
  const [unlockedChallenges, setUnlockedChallenges] = useState<UnlockedChallenge[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || submitting || isPaused) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, flag: flag.trim() }),
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
        setIsSolved(true);
        setResult({
          type: 'success',
          message: data.message,
          pointsAwarded: data.pointsAwarded,
        });
        setFlag('');

        if (data.unlockedChallenges && data.unlockedChallenges.length > 0) {
          setUnlockedChallenges(data.unlockedChallenges);
        }
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Incorrect flag. Try again!',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with server';
      setResult({
        type: 'error',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-[#1a3026] pt-6 space-y-4">
      {isPaused && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center gap-3 text-sm text-amber-400 font-mono-code shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
          <div>
            <span className="font-bold">Competition Paused:</span> Submissions are disabled.
          </div>
        </div>
      )}

      {/* Unlock Notification Toast / Banner */}
      {unlockedChallenges.length > 0 && (
        <div className="p-4 rounded-lg bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-mono-code">
            <Unlock className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>
              🔓 {unlockedChallenges.length === 1 ? 'New challenge unlocked!' : `${unlockedChallenges.length} new challenges unlocked!`}
            </span>
          </div>
          <div className="space-y-1">
            {unlockedChallenges.map((u) => (
              <div key={u.id} className="text-xs font-mono-code text-gray-300 flex items-center gap-2">
                <span>&bull;</span>
                <Link
                  href={`/challenges/${u.id}`}
                  className="text-cyan-300 hover:text-cyan-200 hover:underline font-bold"
                >
                  {u.title}
                </Link>
                <span className="text-gray-500 text-[11px]">(now visible in challenges)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSolved ? (
        <div className="p-4 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/40 flex items-center gap-3 text-sm text-[#00ff41] font-mono-code shadow-[0_0_15px_rgba(0,255,65,0.15)]">
          <CheckCircle2 className="w-5 h-5 text-[#00ff41] shrink-0" />
          <div>
            <span className="font-bold">Challenge Solved!</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono-code text-gray-400 uppercase">
              Submit Flag
            </label>
            <span className="text-[11px] font-mono-code text-gray-500">
              Rate limit: 10 attempts / min
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              required
              disabled={isPaused}
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder={isPaused ? 'Submissions paused (Admin Preview)' : 'flag{...}'}
              className="flex-1 px-4 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] font-mono-code transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={submitting || !flag.trim() || isPaused}
              className="px-6 py-2.5 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isPaused ? 'PAUSED' : submitting ? 'SUBMITTING...' : 'SUBMIT'}</span>
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
  );
}
