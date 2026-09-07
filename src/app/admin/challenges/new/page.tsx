'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';
import { ArrowLeft, Shield, PlusCircle, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function NewChallengePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<{ id: string; title: string; categoryName?: string }[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [prerequisiteId, setPrerequisiteId] = useState('');
  const [flag, setFlag] = useState('');
  const [maxPoints, setMaxPoints] = useState(500);
  const [minPoints, setMinPoints] = useState(100);
  const [decayFactor, setDecayFactor] = useState(50);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch('/api/admin/challenges').then((r) => r.json()),
    ])
      .then(([catData, chData]) => {
        setCategories(catData.categories || []);
        if (catData.categories?.length > 0) {
          setCategoryId(catData.categories[0].id);
        }
        setAvailableChallenges(chData.challenges || []);
        setLoadingCats(false);
      })
      .catch(() => setLoadingCats(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          flag,
          categoryId,
          maxPoints,
          minPoints,
          decayFactor,
          status,
          attachmentUrl: attachmentUrl || null,
          prerequisiteId: prerequisiteId ? prerequisiteId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create challenge');
      }

      router.push('/admin/challenges');
    } catch (err: any) {
      setError(err.message || 'Error submitting challenge');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/challenges"
        className="inline-flex items-center gap-2 text-xs font-mono-code text-gray-400 hover:text-[#00ff41] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Challenge Inventory</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold font-mono-code text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#00ff41]" />
            CREATE CHALLENGE
          </h1>
          <p className="text-xs text-gray-400 font-mono-code mt-1">
            Set challenge details, category, and dynamic scoring.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300 font-mono-code">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Challenge Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Buffer Overflow 101"
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white focus:outline-none focus:border-[#00ff41] font-mono-code"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
              Prerequisite Challenge (Optional)
            </label>
            <select
              value={prerequisiteId}
              onChange={(e) => setPrerequisiteId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white focus:outline-none focus:border-[#00ff41] font-mono-code"
            >
              <option value="">(None - Visible immediately)</option>
              {availableChallenges.map((ac) => (
                <option key={ac.id} value={ac.id}>
                  {ac.title} {ac.categoryName ? `(${ac.categoryName})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 font-mono-code mt-1">
              If selected, this challenge will stay hidden from players until they solve the prerequisite challenge.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
              Flag
            </label>
            <input
              type="text"
              required
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="flag{your_secret_flag_here}"
              className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-[#00ff41] placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
            />
          </div>

          {/* Dynamic scoring calibration */}
          <div className="p-4 rounded border border-[#1a3026] bg-[#080d0b] space-y-4">
            <div className="text-xs font-mono-code font-bold uppercase text-[#00ff41]">
              Dynamic Scoring Settings
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono-code text-gray-400 mb-1">
                  Initial / Max Points
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code text-gray-400 mb-1">
                  Floor / Min Points
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={minPoints}
                  onChange={(e) => setMinPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code text-gray-400 mb-1">
                  Decay Factor
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={decayFactor}
                  onChange={(e) => setDecayFactor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 font-mono-code">
              Logarithmic formula: current = max(min, max - decay * ln(solves + 1))
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white focus:outline-none focus:border-[#00ff41] font-mono-code"
              >
                <option value="published">Published (Visible to players)</option>
                <option value="draft">Draft (Hidden from players)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Attachment URL (Optional)
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/file.zip"
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code"
              />
            </div>
          </div>

          {/* Description & Markdown Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono-code text-gray-400 uppercase">
                Description (Markdown Supported)
              </label>
              <div className="flex gap-1 border border-[#1a3026] rounded p-0.5 bg-[#080d0b]">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2.5 py-1 text-xs font-mono-code rounded ${
                    activeTab === 'write' ? 'bg-[#13241d] text-[#00ff41]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 text-xs font-mono-code rounded ${
                    activeTab === 'preview' ? 'bg-[#13241d] text-[#00ff41]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                required
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide challenge details, hints, or connection info..."
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] font-mono-code leading-relaxed"
              />
            ) : (
              <div
                className="w-full min-h-[200px] p-4 rounded bg-[#080d0b] border border-[#1a3026] prose prose-invert max-w-none text-sm font-sans"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(description || '*No description provided yet.*') }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
          >
            {submitting ? 'CREATING...' : 'CREATE CHALLENGE'}
          </button>
        </form>
      </div>
    </div>
  );
}
