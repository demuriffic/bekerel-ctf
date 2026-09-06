import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import {
  LayoutDashboard,
  Shield,
  FolderTree,
  Users,
  ScrollText,
  Settings,
  Download,
  Terminal,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect('/login');
  }

  const adminLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/challenges', label: 'Challenges', icon: Shield },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/players', label: 'Players', icon: Users },
    { href: '/admin/submissions', label: 'Audit Logs', icon: ScrollText },
    { href: '/admin/settings', label: 'CTF Settings', icon: Settings },
    { href: '/admin/export', label: 'Data Export', icon: Download },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Subheader & Navigation */}
      <div className="border-b border-amber-500/30 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono-code text-white">
                ADMIN CONTROL CENTER
              </h2>
              <p className="text-xs text-amber-400/80 font-mono-code">
                ROOT_ACCESS_GRANTED // PLATFORM MANAGEMENT // {admin.username}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Links */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-code text-gray-300 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
