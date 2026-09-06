'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, Flame, ExternalLink, Filter, Target } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  categoryId: string;
  currentPoints: number;
  maxPoints: number;
  minPoints: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/challenges')
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setCategories(data.categories || []);
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00ff41]" />
            CHALLENGE ARENA
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Select a target, bypass defenses, capture the flag. Dynamic point values decay with each solve.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded bg-[#0d1613] border border-[#1a3026] flex items-center gap-3">
            <div className="text-xs font-mono-code text-gray-400">YOUR SOLVES:</div>
            <div className="text-lg font-bold font-mono-code text-[#00ff41]">
              {totalSolves} / {challenges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono-code mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>VECTORS:</span>
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
      {loading ? (
        <div className="text-center py-20 font-mono-code text-gray-500 animate-pulse">
          SCANNING CHALLENGE VECTORS...
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#1a3026] rounded-lg p-12 text-gray-500 font-mono-code">
          NO CHALLENGES AVAILABLE IN THIS VECTOR
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((ch) => {
            const cat = categoryMap.get(ch.categoryId);
            return (
              <Link
                key={ch.id}
                href={`/challenges/${ch.id}`}
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
                        <span>Completed</span>
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
                    <span>Infiltrate</span>
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
