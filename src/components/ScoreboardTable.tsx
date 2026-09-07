'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User } from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  score: number;
  solvesCount: number;
  lastSolveAt: string | null;
}

interface ScoreboardTableProps {
  leaderboard: LeaderboardEntry[];
}

export default function ScoreboardTable({ leaderboard }: ScoreboardTableProps) {
  const [search, setSearch] = useState('');

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
              {filteredLeaderboard.length === 0 ? (
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
