'use client';

import { Download, FileJson, FileSpreadsheet, Shield, Trophy, Activity, ScrollText } from 'lucide-react';

export default function AdminExportPage() {
  const exports = [
    {
      title: 'Full Platform Backup',
      description: 'Complete archive of all users, challenges, categories, solves, and submissions in JSON format.',
      format: 'JSON',
      icon: FileJson,
      color: '#00ff41',
      href: '/api/admin/export?format=json',
    },
    {
      title: 'Scoreboard Standings',
      description: 'Ranked list of all players with scores, solve counts, and usernames in CSV format.',
      format: 'CSV',
      icon: Trophy,
      color: '#f59e0b',
      href: '/api/admin/export?format=csv&type=scoreboard',
    },
    {
      title: 'Solves History',
      description: 'Every captured flag event with user details, challenge, category, and points awarded.',
      format: 'CSV',
      icon: Activity,
      color: '#06b6d4',
      href: '/api/admin/export?format=csv&type=solves',
    },
    {
      title: 'Submissions Log',
      description: 'Full record of every flag submission attempt (both valid and invalid) with timestamps.',
      format: 'CSV',
      icon: ScrollText,
      color: '#ec4899',
      href: '/api/admin/export?format=csv&type=submissions',
    },
    {
      title: 'Challenge Inventory',
      description: 'Complete list of all challenges, categories, flags, and point decay configurations.',
      format: 'CSV',
      icon: Shield,
      color: '#8b5cf6',
      href: '/api/admin/export?format=csv&type=challenges',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
          <Download className="w-6 h-6 text-[#00ff41]" />
          DATA EXPORT
        </h1>
        <p className="text-xs text-gray-400 font-mono-code mt-1">
          Export CSV and JSON files for analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-lg border border-[#1a3026] bg-[#0d1613] flex flex-col justify-between space-y-4 hover:border-[#00ff41]/30 transition-all shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold font-mono-code text-white text-base">
                      {item.title}
                    </h3>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border"
                    style={{
                      borderColor: `${item.color}40`,
                      backgroundColor: `${item.color}10`,
                      color: item.color,
                    }}
                  >
                    {item.format}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono-code leading-relaxed">
                  {item.description}
                </p>
              </div>

              <a
                href={item.href}
                download
                className="w-full py-2 px-4 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] hover:border-[#00ff41]/40 text-xs font-mono-code font-semibold text-white hover:text-[#00ff41] flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD {item.format}</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
