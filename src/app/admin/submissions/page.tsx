'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScrollText, Search, CheckCircle2, XCircle, Filter, RefreshCw } from 'lucide-react';

interface SubmissionLogItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  challengeId: string;
  challengeTitle: string;
  categoryName: string;
  submittedFlag: string;
  correct: boolean;
  submittedAt: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissions = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    fetch('/api/admin/submissions?limit=250')
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.submissions || []);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.challengeTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.submittedFlag.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'correct') return s.correct;
    if (statusFilter === 'incorrect') return !s.correct;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-[#00ff41]" />
            SUBMISSIONS
          </h1>
          <p className="text-xs text-gray-400 font-mono-code mt-1">
            Log of all flag submissions.
          </p>
        </div>

        <button
          onClick={() => fetchSubmissions(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] text-xs font-mono-code text-gray-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00ff41]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player, challenge, or flag..."
            className="w-full pl-9 pr-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono-code">STATUS:</span>
          {(['all', 'correct', 'incorrect'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded text-xs font-mono-code uppercase transition-all ${
                statusFilter === filter
                  ? 'bg-[#1a3026] text-[#00ff41] border border-[#00ff41]/40'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-code">
            <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Challenge</th>
                <th className="py-3 px-4">Submitted Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3026]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Loading submissions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No submissions found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-[#13241d]/50 transition-colors ${
                      s.correct ? 'bg-[#00ff41]/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      {s.correct ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CORRECT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                          <XCircle className="w-3 h-3" />
                          <span>INCORRECT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link href={`/profile/${s.username}`} className="hover:text-[#00ff41]">
                        {s.username}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300">
                      <Link href={`/challenges/${s.challengeId}`} className="hover:text-[#00ff41]">
                        {s.challengeTitle}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-[#080d0b] border border-[#1a3026] text-xs font-mono-code text-gray-300 break-all select-all">
                        {s.submittedFlag}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
