'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      router.push('/challenges');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]">
            <Terminal className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-mono-code text-white tracking-wide">
            LOG IN
          </h2>
          <p className="text-xs text-gray-400 font-mono-code">
            Enter your credentials to continue
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613]/90 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 p-3 rounded bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300 font-mono-code">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="username or user@example.com"
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] font-mono-code transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] font-mono-code transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
            >
              {loading ? (
                <span>LOGGING IN...</span>
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1a3026] text-center text-xs text-gray-400 font-mono-code">
            Need an account?{' '}
            <Link href="/register" className="text-[#00ff41] hover:underline font-semibold">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
