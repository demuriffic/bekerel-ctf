import { Terminal } from 'lucide-react';

export default function Footer({ ctfName, ctfDescription }: { ctfName: string; ctfDescription: string }) {
  return (
    <footer className="border-t border-[#1a3026] bg-[#060a08] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-mono-code">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00ff41]" />
          <span>{ctfName}</span>
          <span>•</span>
          <span className="text-gray-400">{ctfDescription}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></span>
            SYSTEM OPERATIONAL
          </span>
          <span>// ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
}
