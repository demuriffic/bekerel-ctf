'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Trash2,
  UserCheck,
  Award,
} from 'lucide-react';

interface PlayerItem {
  id: string;
  username: string;
  email: string;
  role: 'player' | 'admin';
  banned: boolean;
  solvesCount: number;
  totalScore: number;
  createdAt: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlayers = () => {
    fetch('/api/admin/players')
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleUpdate = async (userId: string, updates: { banned?: boolean; role?: string }) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });

      const data = await res.json();
      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, ...data.player } : p))
        );
      } else {
        alert(data.error || 'Failed to update player');
      }
    } catch {
      alert('Error updating player');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete player "${username}" and all their solves? This cannot be undone!`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/players?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => p.id !== userId));
      } else {
        alert(data.error || 'Failed to delete player');
      }
    } catch {
      alert('Error communicating with server');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00ff41]" />
            PLAYERS
          </h1>
          <p className="text-xs text-gray-400 font-mono-code mt-1">
            Manage players, bans, and roles.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by username or email..."
          className="w-full pl-9 pr-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
        />
      </div>

      {/* Players Table */}
      <div className="border border-[#1a3026] rounded-lg bg-[#0d1613] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono-code">
            <thead className="bg-[#080d0b] text-xs uppercase text-gray-400 border-b border-[#1a3026]">
              <tr>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Solves</th>
                <th className="py-3 px-4 text-right">Points</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3026]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Loading players...
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => {
                  const isLoading = actionLoading === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-[#13241d]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <Link href={`/profile/${p.username}`} className="hover:text-[#00ff41]">
                          {p.username}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {p.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.banned
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/30'
                          }`}
                        >
                          {p.banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {p.solvesCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#00ff41]">
                        {p.totalScore}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ban / Unban */}
                          <button
                            onClick={() => handleUpdate(p.id, { banned: !p.banned })}
                            disabled={isLoading}
                            className={`p-1.5 rounded transition-colors text-xs flex items-center gap-1 ${
                              p.banned
                                ? 'text-[#00ff41] hover:bg-[#00ff41]/10'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={p.banned ? 'Unban player' : 'Ban player'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{p.banned ? 'Lift Ban' : 'Ban'}</span>
                          </button>

                          {/* Promote / Demote */}
                          <button
                            onClick={() =>
                              handleUpdate(p.id, { role: p.role === 'admin' ? 'player' : 'admin' })
                            }
                            disabled={isLoading}
                            className="p-1.5 rounded text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors text-xs flex items-center gap-1"
                            title={p.role === 'admin' ? 'Demote to player' : 'Promote to admin'}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{p.role === 'admin' ? 'Demote' : 'Promote'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p.id, p.username)}
                            disabled={isLoading}
                            className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
