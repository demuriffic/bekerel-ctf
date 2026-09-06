'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Terminal, Shield, Trophy, Activity, User, LogOut, ShieldAlert, LineChart } from 'lucide-react';

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: 'player' | 'admin';
}

export default function Navbar({ ctfName }: { ctfName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/challenges', label: 'Challenges', icon: Shield },
    { href: '/scoreboard', label: 'Scoreboard', icon: Trophy },
    { href: '/scoreboard/chart', label: 'Timeline', icon: LineChart },
    { href: '/feed', label: 'Feed', icon: Activity },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1a3026] bg-[#080d0b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center group-hover:border-[#00ff41] transition-all">
                <Terminal className="w-4 h-4 text-[#00ff41]" />
              </div>
              <span className="font-mono-code font-bold tracking-wider text-white group-hover:text-[#00ff41] transition-colors">
                {ctfName}
              </span>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 shadow-[0_0_10px_rgba(0,255,65,0.15)]'
                      : 'text-gray-400 hover:text-white hover:bg-[#13241d]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth status & actions */}
          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                          pathname.startsWith('/admin')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-amber-500/10 text-amber-400/80 border border-amber-500/20 hover:text-amber-300 hover:border-amber-500/50'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Admin</span>
                      </Link>
                    )}

                    <Link
                      href={`/profile/${user.username}`}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-mono-code transition-all ${
                        pathname.startsWith('/profile')
                          ? 'bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30'
                          : 'text-gray-300 hover:text-[#00ff41] hover:bg-[#13241d]'
                      }`}
                    >
                      <User className="w-4 h-4 text-[#00ff41]" />
                      <span>{user.username}</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3.5 py-1.5 text-sm font-medium text-gray-300 hover:text-white rounded hover:bg-[#13241d] transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="px-3.5 py-1.5 text-sm font-medium bg-[#00ff41] text-[#041409] font-semibold rounded hover:bg-[#00e63a] transition-all shadow-[0_0_10px_rgba(0,255,65,0.25)]"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
