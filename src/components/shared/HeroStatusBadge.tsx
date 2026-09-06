'use client';

import { useEffect, useState } from 'react';

interface StatusData {
  isPaused: boolean;
  isActive: boolean;
  hasEnded?: boolean;
  hasStarted?: boolean;
}

interface HeroStatusBadgeProps {
  initialStatus?: StatusData;
}

export default function HeroStatusBadge({ initialStatus }: HeroStatusBadgeProps) {
  const [status, setStatus] = useState<StatusData>(
    initialStatus || {
      isPaused: false,
      isActive: true,
      hasEnded: false,
      hasStarted: true,
    }
  );

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setStatus({
            isPaused: Boolean(data.isPaused),
            isActive: Boolean(data.isActive),
            hasEnded: Boolean(data.hasEnded),
            hasStarted: Boolean(data.hasStarted),
          });
        }
      } catch (err) {
        // Silently ignore network polling errors
      }
    };

    // Check immediately on mount to handle stale client router cache
    checkStatus();

    // Poll every 3 seconds for real-time responsiveness
    const interval = setInterval(checkStatus, 3000);

    // Refresh immediately when window gains focus or tab becomes visible
    const handleFocus = () => checkStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (status.isPaused) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono-code transition-all border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>COMPETITION PAUSED</span>
      </div>
    );
  }

  if (status.isActive) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono-code transition-all border-[#00ff41]/30 bg-[#00ff41]/10 text-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.15)]">
        <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping" />
        <span>COMPETITION ACTIVE</span>
      </div>
    );
  }

  if (status.hasEnded) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono-code transition-all border-red-500/30 bg-red-500/10 text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span>COMPETITION ENDED</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono-code transition-all border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
      <span className="w-2 h-2 rounded-full bg-cyan-400" />
      <span>STARTING SOON</span>
    </div>
  );
}
