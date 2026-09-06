'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ChallengeAdminItem {
  id: string;
  title: string;
  categoryName: string;
  categoryColor: string;
  flag: string;
  currentPoints: number;
  maxPoints: number;
  minPoints: number;
  decayFactor: number;
  solveCount: number;
  solveRate: number;
  firstBlood: { username: string; solvedAt: string } | null;
  status: 'draft' | 'published';
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleFlags, setVisibleFlags] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChallenges = () => {
    fetch('/api/admin/challenges')
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const toggleFlagVisibility = (id: string) => {
    setVisibleFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete challenge "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete challenge');
      }
    } catch {
      alert('Error communicating with server');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#00ff41]" />
            CHALLENGE INVENTORY
          </h1>
          <p className="text-xs text-gray-400 font-mono-code">
            Create, calibrate dynamic scoring, inspect flags, and manage challenge visibility.
          </p>
        </div>

        <Link
          href="/admin/challenges/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00ff41] text-[#041409] font-bold text-xs font-mono-code uppercase hover:bg-[#00e63a] transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Challenge</span>
        </Link>
      </div>

      {/* Challenges Table */}
      <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-code">
            <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
              <tr>
                <th className="py-3 px-4">Challenge</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4">Solves & Rate</th>
                <th className="py-3 px-4">First Blood</th>
                <th className="py-3 px-4">Flag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3026]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 animate-pulse">
                    LOADING CHALLENGES...
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    NO CHALLENGES CREATED YET
                  </td>
                </tr>
              ) : (
                challenges.map((ch) => (
                  <tr key={ch.id} className="hover:bg-[#13241d]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate">
                      <Link href={`/challenges/${ch.id}`} className="hover:text-[#00ff41] flex items-center gap-1.5">
                        <span>{ch.title}</span>
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-semibold border"
                        style={{
                          borderColor: `${ch.categoryColor}40`,
                          backgroundColor: `${ch.categoryColor}15`,
                          color: ch.categoryColor,
                        }}
                      >
                        {ch.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ch.status === 'published'
                            ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#00ff41]">{ch.currentPoints}</span>
                      <span className="text-gray-500 text-xs"> / {ch.maxPoints}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300">
                      {ch.solveCount} solves ({ch.solveRate}%)
                    </td>
                    <td className="py-3 px-4 text-xs text-amber-400">
                      {ch.firstBlood ? (
                        <span title={`Solved at ${ch.firstBlood.solvedAt}`}>
                          🩸 {ch.firstBlood.username}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-code text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-mono-code text-[11px]">
                          {visibleFlags[ch.id] ? ch.flag : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleFlagVisibility(ch.id)}
                          className="p-1 text-gray-500 hover:text-white"
                          title={visibleFlags[ch.id] ? 'Hide flag' : 'Reveal flag'}
                        >
                          {visibleFlags[ch.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/challenges/${ch.id}`}
                          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                          title="Edit Challenge"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(ch.id, ch.title)}
                          disabled={deletingId === ch.id}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          title="Delete Challenge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
