'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, Flame, ExternalLink, Filter, Target, AlertTriangle, PauseCircle } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  categoryId: string;
  currentPoints: number;
  maxPoints: number;
  minPoints: number;
  decayFactor: number;
  solveCount: number;
  status: string;
  isSolved: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/challenges')
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setCategories(data.categories || []);
        setIsPaused(Boolean(data.isPaused));
        setIsAdmin(Boolean(data.isAdmin));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredChallenges =
    selectedCategory === 'all'
      ? challenges
      : challenges.filter((c) => c.categoryId === selectedCategory);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totalSolves = challenges.filter((c) => c.isSolved).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 text-center font-mono-code text-gray-500">
        Loading challenges...
      </div>
    );
  }

  // Non-admins cannot see any challenges when paused
  if (isPaused && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-xl border border-amber-500/30 bg-[#0d1613] text-center space-y-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <PauseCircle className="w-12 h-12 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold font-mono-code text-white">
              COMPETITION PAUSED
            </h1>
            <p className="text-base text-gray-400 font-mono-code max-w-lg mx-auto">
              Challenges are temporarily unavailable while the competition is paused. Please check back shortly.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/scoreboard"
              className="px-5 py-2.5 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] hover:border-[#00ff41]/50 text-white text-sm font-mono-code transition-all"
            >
              View Scoreboard
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00ff41]" />
            CHALLENGES
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Solve challenges to earn points. Points dynamically decay as more players solve them.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] flex items-center gap-3">
            <div className="text-xs font-mono-code text-gray-400">Solved:</div>
            <div className="text-lg font-bold font-mono-code text-[#00ff41]">
              {totalSolves} / {challenges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Paused Banner */}
      {isPaused && isAdmin && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse" />
            <div className="text-sm font-mono-code">
              <span className="font-bold">Competition Paused:</span> Non-admin players cannot see challenges. As an admin, you have full preview access.
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-mono-code underline hover:text-amber-300 whitespace-nowrap"
          >
            Manage in Settings &rarr;
          </Link>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono-code mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Categories:</span>
        </div>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded text-xs font-mono-code font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#00ff41] text-[#041409] font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)]'
              : 'bg-[#0d1613] text-gray-400 border border-[#1a3026] hover:text-white hover:border-gray-600'
          }`}
        >
          All ({challenges.length})
        </button>

        {categories.map((cat) => {
          const count = challenges.filter((c) => c.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono-code font-medium transition-all flex items-center gap-1.5 border`}
              style={{
                borderColor: isSelected ? cat.color : '#1a3026',
                backgroundColor: isSelected ? `${cat.color}25` : '#0d1613',
                color: isSelected ? cat.color : '#9ca3af',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Challenges Grid */}
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#1a3026] rounded-lg p-12 text-gray-500 font-mono-code">
          No challenges in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((ch) => {
            const cat = categoryMap.get(ch.categoryId);
            return (
              <Link
                key={ch.id}
                href={`/challenges/${ch.id}`}
                prefetch={false}
                className={`group relative p-5 rounded-lg border transition-all flex flex-col justify-between overflow-hidden ${
                  ch.isSolved
                    ? 'border-[#00ff41]/50 bg-[#00ff41]/5 shadow-[0_0_15px_rgba(0,255,65,0.1)]'
                    : 'border-[#1a3026] bg-[#0d1613] hover:border-[#00ff41]/40 hover:bg-[#13241d]/70 hover:shadow-[0_0_15px_rgba(0,255,65,0.15)]'
                }`}
              >
                {ch.isSolved && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <div className="bg-[#00ff41] text-[#041409] text-[9px] font-mono-code font-extrabold uppercase px-6 py-0.5 rotate-45 shadow">
                      SOLVED
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold border"
                      style={{
                        borderColor: `${cat?.color || '#00ff41'}40`,
                        backgroundColor: `${cat?.color || '#00ff41'}15`,
                        color: cat?.color || '#00ff41',
                      }}
                    >
                      {cat?.name || 'General'}
                    </span>

                    {ch.isSolved ? (
                      <span className="flex items-center gap-1 text-xs text-[#00ff41] font-mono-code">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solved</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 font-mono-code flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {ch.solveCount} {ch.solveCount === 1 ? 'solve' : 'solves'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold font-mono-code text-white group-hover:text-[#00ff41] transition-colors line-clamp-1">
                    {ch.title}
                  </h3>
                </div>

                {/* Footer / Points */}
                <div className="pt-4 mt-4 border-t border-[#1a3026] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono-code text-[#00ff41]">
                      {ch.currentPoints}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono-code uppercase tracking-wider">
                      PTS
                    </span>
                  </div>

                  <span className="text-xs font-mono-code text-gray-400 group-hover:text-white flex items-center gap-1">
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
