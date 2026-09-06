'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { ArrowLeft, Save, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [flag, setFlag] = useState('');
  const [maxPoints, setMaxPoints] = useState(500);
  const [minPoints, setMinPoints] = useState(100);
  const [decayFactor, setDecayFactor] = useState(50);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch(`/api/admin/challenges/${id}`).then((r) => r.json()),
    ])
      .then(([catData, chData]) => {
        setCategories(catData.categories || []);
        const ch = chData.challenge;
        if (ch) {
          setTitle(ch.title);
          setCategoryId(ch.categoryId);
          setFlag(ch.flag);
          setMaxPoints(ch.maxPoints);
          setMinPoints(ch.minPoints);
          setDecayFactor(ch.decayFactor);
          setStatus(ch.status);
          setAttachmentUrl(ch.attachmentUrl || '');
          setDescription(ch.description);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: 'PUT',
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update challenge');
      }

      setSuccess('Challenge updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error updating challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this challenge?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/challenges');
      } else {
        alert('Failed to delete challenge');
      }
    } catch {
      alert('Error communicating with server');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono-code text-gray-500 animate-pulse">
        RETRIEVING CHALLENGE SPECIFICATIONS...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/challenges"
          className="inline-flex items-center gap-2 text-xs font-mono-code text-gray-400 hover:text-[#00ff41] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challenge Inventory</span>
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-mono-code transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Challenge</span>
        </button>
      </div>

      <div className="p-6 sm:p-8 rounded-lg border border-[#1a3026] bg-[#0d1613] shadow-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold font-mono-code text-white">
            MODIFY CHALLENGE: {title}
          </h1>
          <p className="text-xs text-gray-400 font-mono-code mt-1">
            Update challenge configuration, flags, and scoring parameters.
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
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
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
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
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
              Static Flag
            </label>
            <input
              type="text"
              required
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-[#00ff41] font-mono-code"
            />
          </div>

          {/* Dynamic scoring calibration */}
          <div className="p-4 rounded border border-[#1a3026] bg-[#080d0b] space-y-4">
            <div className="text-xs font-mono-code font-bold uppercase text-[#00ff41]">
              Dynamic Scoring Parameters
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-code text-gray-400 mb-1.5 uppercase">
                Attachment URL
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono-code text-gray-400 uppercase">
                Challenge Briefing
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
                className="w-full px-3.5 py-2.5 rounded bg-[#13241d] border border-[#1a3026] text-sm text-white font-mono-code leading-relaxed"
              />
            ) : (
              <div
                className="w-full min-h-[200px] p-4 rounded bg-[#080d0b] border border-[#1a3026] prose prose-invert max-w-none text-sm font-sans"
                dangerouslySetInnerHTML={{ __html: marked.parse(description || '') as string }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded bg-[#00ff41] hover:bg-[#00e63a] text-[#041409] font-bold text-sm font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,65,0.25)] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'SAVING CHANGES...' : 'SAVE CHALLENGE CHANGES'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
