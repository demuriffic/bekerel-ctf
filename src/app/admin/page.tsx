'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Flame,
  ScrollText,
  Activity,
  PlusCircle,
  FolderPlus,
  Download,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface AdminStats {
  totalPlayers: number;
  totalAdmins: number;
  totalBanned: number;
  totalChallenges: number;
  publishedChallenges: number;
  totalSolves: number;
  totalSubmissions: number;
  successRate: number;
}

interface CategoryStat {
  id: string;
  name: string;
  color: string;
  challengesCount: number;
  solvesCount: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized or error');
        return res.json();
      })
      .then((data) => {
        setStats(data.stats);
        setCategories(data.categoryStats || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono-code text-gray-500 animate-pulse">
        GATHERING TELEMETRY METRICS...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 border border-red-500/30 rounded bg-red-950/20 text-center font-mono-code text-red-400">
        ADMIN ACCESS REQUIRED OR ERROR LOADING METRICS
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/challenges/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00ff41] text-[#041409] font-bold text-xs font-mono-code uppercase hover:bg-[#00e63a] transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Challenge</span>
        </Link>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] text-xs font-mono-code text-gray-300 hover:text-white transition-all"
        >
          <FolderPlus className="w-4 h-4 text-cyan-400" />
          <span>Manage Categories</span>
        </Link>
        <Link
          href="/admin/export"
          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] text-xs font-mono-code text-gray-300 hover:text-white transition-all"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Data</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono-code uppercase">
            <span>Players</span>
            <Users className="w-4 h-4 text-[#00ff41]" />
          </div>
          <div className="text-3xl font-bold font-mono-code text-white">
            {stats.totalPlayers}
          </div>
          <div className="text-[11px] text-gray-500 font-mono-code">
            +{stats.totalAdmins} admins • {stats.totalBanned} banned
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono-code uppercase">
            <span>Challenges</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono-code text-white">
            {stats.publishedChallenges}
          </div>
          <div className="text-[11px] text-gray-500 font-mono-code">
            {stats.totalChallenges} total challenges
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono-code uppercase">
            <span>Solves</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono-code text-white">
            {stats.totalSolves}
          </div>
          <div className="text-[11px] text-gray-500 font-mono-code">
            Flags captured
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono-code uppercase">
            <span>Success Rate</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono-code text-white">
            {stats.successRate}%
          </div>
          <div className="text-[11px] text-gray-500 font-mono-code">
            {stats.totalSubmissions} attempts logged
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-6 rounded-lg border border-[#1a3026] bg-[#0d1613] space-y-4">
        <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ff41]" />
          Category Vector Performance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded border bg-[#080d0b] space-y-2"
              style={{ borderColor: `${cat.color}30` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white font-mono-code">{cat.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-mono-code pt-1">
                <span>{cat.challengesCount} challenges</span>
                <span>{cat.solvesCount} solves</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
