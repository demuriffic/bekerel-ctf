'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Trophy, Shield, Flame, Calendar, ArrowLeft, Award, CheckCircle2 } from 'lucide-react';

interface PlayerProfile {
  player: {
    id: string;
    username: string;
    role: string;
    createdAt: string;
    rank: number;
    totalScore: number;
    solvesCount: number;
  };
  categoryBreakdown: {
    name: string;
    color: string;
    count: number;
    points: number;
  }[];
  solves: {
    id: string;
    challengeId: string;
    challengeTitle: string;
    categoryName: string;
    categoryColor: string;
    pointsAwarded: number;
    solvedAt: string;
  }[];
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error('Player not found');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-20 text-center font-mono-code text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-20 text-center space-y-4 font-mono-code">
        <div className="text-red-400">User not found</div>
        <Link href="/scoreboard" className="text-sm text-[#00ff41] hover:underline flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scoreboard</span>
        </Link>
      </div>
    );
  }

  const { player, categoryBreakdown, solves } = data;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center text-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.2)]">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono-code text-white">
                {player.username}
              </h1>
              {player.role === 'admin' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {new Date(player.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-6 border-t sm:border-t-0 border-[#1a3026] pt-4 sm:pt-0">
          <div className="text-center">
            <div className="text-xs font-mono-code text-gray-400 uppercase">RANK</div>
            <div className="text-2xl font-black font-mono-code text-amber-400">
              {player.rank > 0 ? `#${player.rank}` : 'STAFF'}
            </div>
          </div>
          <div className="h-8 w-px bg-[#1a3026]" />
          <div className="text-center">
            <div className="text-xs font-mono-code text-gray-400 uppercase">SCORE</div>
            <div className="text-2xl font-black font-mono-code text-[#00ff41]">{player.totalScore}</div>
          </div>
          <div className="h-8 w-px bg-[#1a3026]" />
          <div className="text-center">
            <div className="text-xs font-mono-code text-gray-400 uppercase">SOLVES</div>
            <div className="text-2xl font-black font-mono-code text-white">{player.solvesCount}</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-mono-code font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00ff41]" />
            Category Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                className="p-4 rounded-lg border bg-[#0d1613] space-y-2"
                style={{ borderColor: `${cat.color}30` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-code font-bold text-white truncate">{cat.name}</span>
                  <span className="text-xs font-mono-code" style={{ color: cat.color }}>
                    {cat.points} pts
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono-code">
                  {cat.count} {cat.count === 1 ? 'solve' : 'solves'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solves History */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono-code font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />
          Solve History ({solves.length})
        </h3>

        <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono-code">
              <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
                <tr>
                  <th className="py-3 px-4">Challenge</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-right">Solved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a3026]">
                {solves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No solves yet
                    </td>
                  </tr>
                ) : (
                  solves.map((s) => (
                    <tr key={s.id} className="hover:bg-[#13241d]/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <Link href={`/challenges/${s.challengeId}`} className="hover:text-[#00ff41]">
                          {s.challengeTitle}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold border"
                          style={{
                            borderColor: `${s.categoryColor}40`,
                            backgroundColor: `${s.categoryColor}15`,
                            color: s.categoryColor,
                          }}
                        >
                          {s.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#00ff41]">
                        +{s.pointsAwarded}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-400">
                        {new Date(s.solvedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
