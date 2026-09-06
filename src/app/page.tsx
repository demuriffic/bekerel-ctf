import Link from 'next/link';
import { db, users, challenges, categories, solves } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { initDb } from '@/db/migrate';
import { getCtfStatus } from '@/lib/ctf';
import { CTF_CONFIG } from '@/lib/config';
import { Terminal, Shield, Trophy, Activity, ArrowRight, Flag, Flame, Target, Cpu } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  await initDb();
  const ctfStatus = await getCtfStatus();

  // Aggregate count queries for high performance and minimal memory usage
  const [playerMetric] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, 'player'), eq(users.banned, false)));

  const [challengeMetric] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challenges)
    .where(eq(challenges.status, 'published'));

  const [solveMetric] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(solves);

  const allCategories = await db.select().from(categories);

  const totalPlayers = playerMetric?.count || 0;
  const totalChallenges = challengeMetric?.count || 0;
  const totalSolves = solveMetric?.count || 0;

  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glowing matrix orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00ff41]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10 space-y-12">
        {/* Status Badge */}
        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono-code transition-all ${
              ctfStatus.isPaused
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : ctfStatus.isActive
                ? 'border-[#00ff41]/30 bg-[#00ff41]/10 text-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.15)]'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                ctfStatus.isPaused
                  ? 'bg-amber-400 animate-ping'
                  : ctfStatus.isActive
                  ? 'bg-[#00ff41] animate-ping'
                  : 'bg-cyan-400'
              }`}
            />
            <span>
              {ctfStatus.isPaused
                ? 'COMPETITION PAUSED // SUBMISSIONS LOCKED'
                : ctfStatus.isActive
                ? 'SYSTEM ONLINE // CTF ACTIVE'
                : ctfStatus.hasEnded
                ? 'COMPETITION CONCLUDED'
                : 'COUNTDOWN INITIALIZED'}
            </span>
          </div>
        </div>

        {/* Hero title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono-code text-gray-500 uppercase tracking-widest">
            <Terminal className="w-4 h-4 text-[#00ff41]" />
            <span>TERMINAL PROTOCOL ENGAGED</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-mono-code">
            <span className="text-[#00ff41] glow-green-text">&gt;</span> {CTF_CONFIG.name}
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-400">
            {CTF_CONFIG.description}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/challenges"
            className="flex items-center gap-2 px-6 py-3 rounded bg-[#00ff41] text-[#041409] font-bold text-base hover:bg-[#00e63a] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]"
          >
            <Flag className="w-5 h-5" />
            <span>Enter Challenge Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/scoreboard"
            className="flex items-center gap-2 px-6 py-3 rounded border border-[#1a3026] bg-[#0d1613] text-gray-200 font-semibold text-base hover:border-[#00ff41]/50 hover:text-[#00ff41] transition-all hover:bg-[#13241d]"
          >
            <Trophy className="w-5 h-5 text-[#00ff41]" />
            <span>Live Scoreboard</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded border border-[#1a3026] bg-[#0d1613]/80 backdrop-blur-sm text-center space-y-1">
            <div className="flex justify-center text-gray-500 mb-1">
              <Shield className="w-5 h-5 text-[#00ff41]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-code text-white">{totalChallenges}</div>
            <div className="text-xs text-gray-400 font-mono-code uppercase">Challenges</div>
          </div>
          <div className="p-4 rounded border border-[#1a3026] bg-[#0d1613]/80 backdrop-blur-sm text-center space-y-1">
            <div className="flex justify-center text-gray-500 mb-1">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-code text-white">{totalSolves}</div>
            <div className="text-xs text-gray-400 font-mono-code uppercase">Flags Captured</div>
          </div>
          <div className="p-4 rounded border border-[#1a3026] bg-[#0d1613]/80 backdrop-blur-sm text-center space-y-1">
            <div className="flex justify-center text-gray-500 mb-1">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-code text-white">{totalPlayers}</div>
            <div className="text-xs text-gray-400 font-mono-code uppercase">Operators</div>
          </div>
          <div className="p-4 rounded border border-[#1a3026] bg-[#0d1613]/80 backdrop-blur-sm text-center space-y-1">
            <div className="flex justify-center text-gray-500 mb-1">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono-code text-white">{allCategories.length}</div>
            <div className="text-xs text-gray-400 font-mono-code uppercase">Vectors</div>
          </div>
        </div>

        {/* Categories preview */}
        <div className="border border-[#1a3026] rounded-lg p-6 bg-[#0d1613]/60 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a3026] pb-3">
            <h3 className="text-sm font-mono-code font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00ff41]" />
              Threat Vectors & Categories
            </h3>
            <span className="text-xs font-mono-code text-gray-500">DYNAMIC SCORING ENABLED</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {allCategories.map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1.5 rounded text-xs font-mono-code font-semibold flex items-center gap-2 border"
                style={{
                  borderColor: `${cat.color}40`,
                  backgroundColor: `${cat.color}15`,
                  color: cat.color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded border border-[#1a3026] bg-[#0a110e] space-y-2">
            <div className="w-8 h-8 rounded bg-[#00ff41]/10 flex items-center justify-center text-[#00ff41] font-mono-code font-bold text-sm">
              01
            </div>
            <h4 className="font-semibold text-white">Select a Challenge</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Explore challenges across Web, Cryptography, Reverse Engineering, Forensics, and more.
            </p>
          </div>
          <div className="p-5 rounded border border-[#1a3026] bg-[#0a110e] space-y-2">
            <div className="w-8 h-8 rounded bg-[#00ff41]/10 flex items-center justify-center text-[#00ff41] font-mono-code font-bold text-sm">
              02
            </div>
            <h4 className="font-semibold text-white">Capture the Flag</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Exploit vulnerabilities, solve cryptographic puzzles, or reverse binaries to extract the secret flag string.
            </p>
          </div>
          <div className="p-5 rounded border border-[#1a3026] bg-[#0a110e] space-y-2">
            <div className="w-8 h-8 rounded bg-[#00ff41]/10 flex items-center justify-center text-[#00ff41] font-mono-code font-bold text-sm">
              03
            </div>
            <h4 className="font-semibold text-white">Climb the Leaderboard</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Submit your flag to earn points. Challenge points dynamically decay as more competitors solve them!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
