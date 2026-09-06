'use client';

import { useState, useEffect } from 'react';
import { Settings, Clock, Save, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function AdminSettingsPage() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
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
          }
          if (s.endTime) {
            setEndTime(toLocalInputFormat(s.endTime));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
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

  const clearWindow = () => {
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono-code text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#00ff41]" />
          COMPETITION LIFECYCLE SETTINGS
        </h1>
        <p className="text-xs text-gray-400 font-mono-code mt-1">
          Define global start and end timestamps. When inactive, flag submissions will be locked for competitors.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-xl space-y-6">
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

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00ff41]" />
                <span>CTF Start Time (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code focus:outline-none focus:border-[#00ff41]"
              />
              <p className="text-[10px] text-gray-500 font-mono-code mt-1">
                Leave empty to allow immediate access
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CTF End Time (UTC)</span>
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

          <div className="p-4 rounded border border-[#1a3026] bg-[#080d0b] space-y-2">
            <div className="text-xs font-mono-code text-[#00ff41] font-bold uppercase">
              Operational Status Preview
            </div>
            <p className="text-xs text-gray-400 font-mono-code leading-relaxed">
              {!startTime && !endTime && (
                <span className="text-[#00ff41]">
                  ● Always-on mode: Competition is currently ACTIVE and accepts submissions indefinitely.
                </span>
              )}
              {startTime && (
                <span className="block text-cyan-300">
                  ▶ Starts: {new Date(startTime).toLocaleString()}
                </span>
              )}
              {endTime && (
                <span className="block text-amber-300">
                  ⏹ Concludes: {new Date(endTime).toLocaleString()}
                </span>
              )}
            </p>
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
    </div>
  );
}
