'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, LineChart as ChartIcon, Trophy } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PLAYER_COLORS = [
  '#00ff41', // Matrix green
  '#00e5ff', // Cyan
  '#ff007f', // Neon pink
  '#ffd600', // Yellow
  '#b388ff', // Purple
  '#ff6d00', // Orange
  '#00b0ff', // Light Blue
  '#76ff03', // Lime
  '#ff1744', // Red
  '#e040fb', // Magenta
];

export default function ScoreboardChartPage() {
  const [players, setPlayers] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scoreboard/chart')
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players || []);
        setChartData(data.chartData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a3026] pb-6">
        <div>
          <Link
            href="/scoreboard"
            className="inline-flex items-center gap-2 text-xs font-mono-code text-gray-400 hover:text-[#00ff41] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scoreboard</span>
          </Link>
          <h1 className="text-3xl font-bold font-mono-code text-white flex items-center gap-3">
            <ChartIcon className="w-8 h-8 text-[#00ff41]" />
            SCORE TIMELINE
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono-code">
            Scores over time for the top 10 players.
          </p>
        </div>
      </div>

      {/* Chart Container Card */}
      <div className="p-6 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-2xl">
        {loading ? (
          <div className="h-96 flex items-center justify-center font-mono-code text-gray-500">
            Loading timeline...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center font-mono-code text-gray-500 space-y-2">
            <Trophy className="w-12 h-12 text-gray-600 mb-2" />
            <div>No solves yet</div>
            <p className="text-xs text-gray-600">Points will appear once players solve challenges.</p>
          </div>
        ) : (
          <div className="h-[500px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3026" />
                <XAxis
                  dataKey="time"
                  stroke="#527866"
                  tick={{ fill: '#7ba893', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#527866"
                  tick={{ fill: '#7ba893', fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080d0b',
                    borderColor: '#1a3026',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#e6f7ef' }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    paddingTop: '15px',
                  }}
                />
                {players.map((player, idx) => (
                  <Line
                    key={player}
                    type="stepAfter"
                    dataKey={player}
                    name={player}
                    stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
