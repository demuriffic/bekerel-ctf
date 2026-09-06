'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Pause,
  Play,
  RotateCcw,
  AlertTriangle,
  Flame,
  Trash2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = () => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        const s = data.settings;
        if (s) {
          const toLocalInputFormat = (isoString: string) => {
            const d = new Date(isoString);
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().slice(0, 16);
          };

          if (s.startTime) {
            setStartTime(toLocalInputFormat(s.startTime));
          } else {
            setStartTime('');
          }
          if (s.endTime) {
            setEndTime(toLocalInputFormat(s.endTime));
          } else {
            setEndTime('');
          }
          setIsPaused(Boolean(s.isPaused));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTime ? new Date(startTime).toISOString() : null,
          endTime: endTime ? new Date(endTime).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Competition window settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async () => {
    const nextPaused = !isPaused;
    const confirmMsg = nextPaused
      ? 'Are you sure you want to PAUSE the CTF? Challenges will be hidden and flag submissions locked for regular participants.'
      : 'Resume the CTF competition? Challenges and submissions will be re-opened for participants.';

    if (!confirm(confirmMsg)) return;

    setError('');
    setSuccess('');
    setTogglingPause(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: nextPaused }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update pause state');

      setIsPaused(nextPaused);
      setSuccess(nextPaused ? 'Competition is now PAUSED' : 'Competition is now RESUMED & ACTIVE');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error toggling pause state');
    } finally {
      setTogglingPause(false);
    }
  };

  const handleReset = async (mode: 'competition' | 'factory') => {
    const promptText =
      mode === 'competition'
        ? 'DANGER: This will wipe ALL solves and submissions, resetting the scoreboard and dynamic points to zero. Custom challenges and player accounts remain. Proceed?'
        : 'CRITICAL DANGER: FULL FACTORY RESET. This wipes all solves, submissions, non-admin player accounts, and custom challenges. Default starter challenges will be restored. Proceed?';

    if (!confirm(promptText)) return;
    if (mode === 'factory' && !confirm('Please confirm one more time: Type OK to wipe everything.')) return;

    setError('');
    setSuccess('');
    setResetting(true);

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset');

      setSuccess(data.message || 'Reset complete!');
      fetchSettings();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Error executing reset');
    } finally {
      setResetting(false);
    }
  };

  const clearWindow = () => {
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#00ff41]" />
          CTF SETTINGS
        </h1>
        <p className="text-xs text-gray-400 font-mono-code mt-1">
          Pause or resume submissions, set competition start/end times, and reset data.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300 font-mono-code">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded bg-[#00ff41]/10 border border-[#00ff41]/40 flex items-start gap-2.5 text-xs text-[#00ff41] font-mono-code">
          <CheckCircle2 className="w-4 h-4 text-[#00ff41] shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* PAUSE / RESUME CTF LIVE CONTROL */}
      <div
        className={`p-6 rounded-lg border transition-all shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
          isPaused
            ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'bg-[#0d1613] border-[#00ff41]/40 shadow-[0_0_15px_rgba(0,255,65,0.1)]'
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isPaused ? 'bg-amber-400 animate-ping' : 'bg-[#00ff41] animate-pulse'
              }`}
            />
            <h2 className="text-lg font-bold font-mono-code text-white uppercase tracking-wider">
              {isPaused ? 'COMPETITION PAUSED' : 'COMPETITION ACTIVE'}
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono-code">
            {isPaused
              ? 'The competition is paused. Challenges and flag submissions are blocked for regular participants.'
              : 'Submissions and challenges are live for all participants.'}
          </p>
        </div>

        <button
          onClick={handleTogglePause}
          disabled={togglingPause || loading}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded text-xs font-mono-code font-bold uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 shadow-lg ${
            isPaused
              ? 'bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] shadow-[0_0_15px_rgba(0,255,65,0.3)]'
              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{togglingPause ? 'RESUMING...' : 'RESUME COMPETITION'}</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>{togglingPause ? 'PAUSING...' : 'PAUSE COMPETITION'}</span>
            </>
          )}
        </button>
      </div>

      {/* SCHEDULED TIMING WINDOW */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-xl space-y-6">
        <div>
          <h2 className="text-sm font-bold font-mono-code text-white uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00ff41]" />
            Scheduled Competition Window
          </h2>
          <p className="text-xs text-gray-400 font-mono-code mt-0.5">
            Configure optional automatic start and end timestamps.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>CTF Start Time (Local)</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code focus:outline-none focus:border-[#00ff41]"
              />
              <p className="text-[10px] text-gray-500 font-mono-code mt-1">
                Leave empty for immediate opening
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CTF End Time (Local)</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code focus:outline-none focus:border-[#00ff41]"
              />
              <p className="text-[10px] text-gray-500 font-mono-code mt-1">
                Leave empty for no time limit
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-xs font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'SAVING...' : 'SAVE TIMING WINDOW'}</span>
            </button>

            <button
              type="button"
              onClick={clearWindow}
              className="px-4 py-2.5 rounded border border-[#1a3026] bg-[#13241d] hover:bg-[#1a3026] text-xs font-mono-code text-gray-300 hover:text-white transition-colors"
            >
              Reset to Always-On
            </button>
          </div>
        </form>
      </div>

      {/* DANGER ZONE: RESET OPTIONS */}
      <div className="p-6 sm:p-8 rounded-lg border border-red-900/40 bg-[#120909] shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold font-mono-code uppercase tracking-wider">
            Danger Zone: Reset Competition
          </h2>
        </div>
        <p className="text-xs text-gray-400 font-mono-code leading-relaxed">
          Permanently delete submission data and reset scores. Use this to clear test data before starting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Reset Solves Only */}
          <div className="p-4 rounded border border-red-900/30 bg-[#180d0d] flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold font-mono-code text-sm text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset Solves & Scores</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono-code mt-1 leading-relaxed">
                Clears all solves, resets scores to 0, and restores challenge points to maximum. Keeps player accounts and challenges.
              </p>
            </div>
            <button
              onClick={() => handleReset('competition')}
              disabled={resetting}
              className="w-full py-2 px-3 rounded border border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/40 text-amber-400 hover:text-amber-300 text-xs font-mono-code font-bold uppercase transition-all disabled:opacity-50"
            >
              {resetting ? 'RESETTING...' : 'RESET SOLVES & SCORES'}
            </button>
          </div>

          {/* Full Factory Reset */}
          <div className="p-4 rounded border border-red-500/30 bg-[#220c0c] flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold font-mono-code text-sm text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Full Reset</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono-code mt-1 leading-relaxed">
                Deletes all solves, submissions, player accounts, and custom challenges. Restores default starter categories and challenges.
              </p>
            </div>
            <button
              onClick={() => handleReset('factory')}
              disabled={resetting}
              className="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-mono-code font-bold uppercase transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              {resetting ? 'RESETTING...' : 'FULL RESET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
