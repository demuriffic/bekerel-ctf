'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Flame, Shield, User, Clock, RefreshCw, Zap } from 'lucide-react';

interface FeedItem {
  id: string;
  username: string;
  challengeId: string;
  challengeTitle: string;
  categoryName: string;
  categoryColor: string;
  pointsAwarded: number;
  solvedAt: string;
  isFirstBlood: boolean;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    fetch('/api/feed')
      .then((res) => res.json())
      .then((data) => {
        setFeed(data.feed || []);
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
    fetchFeed();
    const interval = setInterval(() => fetchFeed(), 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#00ff41]" />
            SOLVES TRANSMISSION FEED
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Live telemetry of system infiltrations and flag captures across the grid.
          </p>
        </div>

        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1a3026] bg-[#0d1613] hover:bg-[#13241d] hover:border-[#00ff41]/40 text-xs font-mono-code text-gray-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00ff41]' : ''}`} />
          <span>REFRESH FEED</span>
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center font-mono-code text-gray-500 animate-pulse">
            INTERCEPTING TELEMETRY PACKETS...
          </div>
        ) : feed.length === 0 ? (
          <div className="p-12 border border-dashed border-[#1a3026] rounded-lg text-center font-mono-code text-gray-500 space-y-2">
            <div>NO INFILTRATIONS DETECTED YET</div>
            <p className="text-xs text-gray-600">Be the first operator to solve a challenge!</p>
          </div>
        ) : (
          feed.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.isFirstBlood
                  ? 'border-red-500/40 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'border-[#1a3026] bg-[#0d1613] hover:border-[#00ff41]/30'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.isFirstBlood
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41]'
                  }`}
                >
                  {item.isFirstBlood ? <Zap className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/${item.username}`}
                      className="font-bold font-mono-code text-white hover:text-[#00ff41] transition-colors"
                    >
                      {item.username}
                    </Link>
                    <span className="text-xs text-gray-500 font-mono-code">captured</span>
                    <Link
                      href={`/challenges/${item.challengeId}`}
                      className="font-bold font-mono-code text-[#00ff41] hover:underline"
                    >
                      {item.challengeTitle}
                    </Link>

                    {item.isFirstBlood && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-extrabold uppercase bg-red-500/20 border border-red-500/50 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                        🩸 FIRST BLOOD
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono-code text-gray-400">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                      style={{
                        borderColor: `${item.categoryColor}40`,
                        backgroundColor: `${item.categoryColor}15`,
                        color: item.categoryColor,
                      }}
                    >
                      {item.categoryName}
                    </span>
                    <span>•</span>
                    <span>+{item.pointsAwarded} pts</span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono-code text-gray-500 self-end sm:self-center flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(item.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
