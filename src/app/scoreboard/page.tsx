'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, LineChart, Search, Medal, User, Clock, Flame } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  score: number;
  solvesCount: number;
  lastSolveAt: string | null;
}

export default function ScoreboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scoreboard')
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#00ff41]" />
            SCOREBOARD
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Live rankings of players.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/scoreboard/chart"
            className="flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] hover:border-[#00ff41]/40 text-xs font-mono-code text-cyan-400 transition-all shadow-sm"
          >
            <LineChart className="w-4 h-4" />
            <span>Timeline Graph</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 */}
          <div className="order-2 md:order-1 p-5 rounded-lg border border-slate-700/60 bg-[#0c1311] text-center space-y-2 relative overflow-hidden">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-500/10 border border-slate-400/30 flex items-center justify-center text-slate-300 font-bold text-lg font-mono-code">
              2
            </div>
            <div className="font-mono-code font-bold text-white text-lg truncate">
              <Link href={`/profile/${leaderboard[1].username}`} className="hover:text-[#00ff41]">
                {leaderboard[1].username}
              </Link>
            </div>
            <div className="text-2xl font-black font-mono-code text-slate-300">
              {leaderboard[1].score} <span className="text-xs font-normal text-gray-500">PTS</span>
            </div>
            <div className="text-xs text-gray-400 font-mono-code">
              {leaderboard[1].solvesCount} solves
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="order-1 md:order-2 p-6 rounded-lg border border-amber-500/50 bg-[#121913] text-center space-y-2 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.15)] md:-translate-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-extrabold text-xl font-mono-code shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              👑
            </div>
            <div className="font-mono-code font-extrabold text-[#00ff41] text-xl truncate">
              <Link href={`/profile/${leaderboard[0].username}`} className="hover:underline">
                {leaderboard[0].username}
              </Link>
            </div>
            <div className="text-3xl font-black font-mono-code text-amber-400">
              {leaderboard[0].score} <span className="text-xs font-normal text-gray-400">PTS</span>
            </div>
            <div className="text-xs text-gray-300 font-mono-code">
              {leaderboard[0].solvesCount} solves
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 md:order-3 p-5 rounded-lg border border-amber-900/40 bg-[#0c1311] text-center space-y-2 relative overflow-hidden">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-950/20 border border-amber-700/30 flex items-center justify-center text-amber-600 font-bold text-lg font-mono-code">
              3
            </div>
            <div className="font-mono-code font-bold text-white text-lg truncate">
              <Link href={`/profile/${leaderboard[2].username}`} className="hover:text-[#00ff41]">
                {leaderboard[2].username}
              </Link>
            </div>
            <div className="text-2xl font-black font-mono-code text-amber-600">
              {leaderboard[2].score} <span className="text-xs font-normal text-gray-500">PTS</span>
            </div>
            <div className="text-xs text-gray-400 font-mono-code">
              {leaderboard[2].solvesCount} solves
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player..."
          className="w-full pl-9 pr-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-code">
            <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4 text-center">Solves</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-right hidden sm:table-cell">Last Solve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3026]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Loading scoreboard...
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-[#13241d]/50 transition-colors ${
                        isTop1 ? 'bg-[#00ff41]/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="text-amber-400 font-bold">🥇 1</span>
                        ) : isTop2 ? (
                          <span className="text-slate-300 font-bold">🥈 2</span>
                        ) : isTop3 ? (
                          <span className="text-amber-600 font-bold">🥉 3</span>
                        ) : (
                          <span className="text-gray-500">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/profile/${entry.username}`}
                          prefetch={false}
                          className="font-semibold text-white hover:text-[#00ff41] transition-colors flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5 text-gray-500" />
                          <span>{entry.username}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-300">
                        {entry.solvesCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#00ff41]">
                        {entry.score}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-gray-500 hidden sm:table-cell">
                        {entry.lastSolveAt
                          ? new Date(entry.lastSolveAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
