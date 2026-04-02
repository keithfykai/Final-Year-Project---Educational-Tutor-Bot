'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import type { StudentProfile } from '@/types/profile';

type Mode = 'full' | 'compact';

type Props = {
  mode: Mode;
};

const LEVEL_LABELS: Record<string, string> = {
  psle: 'PSLE',
  o_level: 'O Level',
  a_level: 'A Level',

};

/* ── Tag input ─────────────────────────────────────────────────────────── */
function TagInput({
  label,
  items,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setInputVal('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem(inputVal);
    }
    if (e.key === 'Backspace' && inputVal === '' && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  };

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>}
      <div
        className={`min-h-[40px] flex flex-wrap gap-1.5 p-2 rounded-xl bg-black border transition cursor-text ${error ? 'border-red-500/70 focus-within:border-red-500' : 'border-gray-700 focus-within:border-blue-500/50'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20"
          >
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(i); }}
              className="hover:text-white transition"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addItem(inputVal)}
          placeholder={items.length === 0 ? (placeholder ?? 'Type and press Enter…') : ''}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ── Skeleton loader ───────────────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-800/60 ${className ?? ''}`} />;
}

/* ── Full mode ─────────────────────────────────────────────────────────── */
function FullPanel() {
  const { profile, loading, saving, saved, error, updateProfile } = useProfile();

  const [draft, setDraft] = useState<Partial<StudentProfile> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync draft from profile when first loaded
  const resolved = draft ?? profile;

  const set = <K extends keyof StudentProfile>(key: K, val: StudentProfile[K]) => {
    setDraft((prev) => ({ ...(prev ?? profile ?? {}), [key]: val }));
    if (fieldErrors[key]) setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleSave = () => {
    if (!resolved) return;
    const errs: Record<string, string> = {};
    if (!resolved.name?.trim()) errs.name = 'Name is required';
    if (!resolved.educationalLevel) errs.educationalLevel = 'Educational level is required';
    if (!resolved.subjectsStudying?.length) errs.subjectsStudying = 'At least one subject is required';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    updateProfile(resolved);
    setDraft(null);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 to-black/30 p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 to-black/30 p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Your Learning Profile</h2>
        {resolved?.updatedAt && (
          <p className="text-xs text-gray-500 mt-0.5">
            Last updated: {new Date(resolved.updatedAt).toLocaleDateString()}
          </p>
        )}
        {resolved?.source?.lastAiUpdateAt && (
          <p className="text-xs text-blue-400/80 mt-1">
            Last AI-reviewed: {new Date(resolved.source.lastAiUpdateAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 border border-gray-800 rounded-xl px-4 py-3 bg-gray-900/40">
        This profile helps personalise your learning experience. You can review and edit it anytime.
        High-confidence updates may be applied automatically after meaningful chat sessions, and you can
        still adjust anything here whenever you want.
      </p>

      {/* Status feedback */}
      {saved && (
        <p className="text-sm text-emerald-400 font-medium">✓ Profile saved</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* AI summary (read-only) */}
      {resolved?.profileSummary && (
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">AI-generated summary</p>
          <p className="text-sm text-gray-300 leading-relaxed">{resolved.profileSummary}</p>
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name — required */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={resolved?.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your name"
            className={`w-full rounded-xl bg-black border px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition ${fieldErrors.name ? 'border-red-500/70 focus:border-red-500' : 'border-gray-700 focus:border-blue-500/50'}`}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
        </div>

        {/* Educational Level — required */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Educational Level <span className="text-red-400">*</span>
          </label>
          <select
            value={resolved?.educationalLevel ?? ''}
            onChange={(e) => set('educationalLevel', e.target.value)}
            className={`w-full rounded-xl bg-black border px-3 py-2 text-sm text-white focus:outline-none transition ${fieldErrors.educationalLevel ? 'border-red-500/70 focus:border-red-500' : 'border-gray-700 focus:border-blue-500/50'}`}
          >
            <option value="">Select level…</option>
            <option value="psle">PSLE</option>
            <option value="o_level">O Level</option>
            <option value="a_level">A Level</option>
          </select>
          {fieldErrors.educationalLevel && <p className="mt-1 text-xs text-red-400">{fieldErrors.educationalLevel}</p>}
        </div>

        {/* Subjects Studying — required */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Subjects Studying <span className="text-red-400">*</span>
          </label>
          <TagInput
            label=""
            items={resolved?.subjectsStudying ?? []}
            onChange={(v) => set('subjectsStudying', v)}
            placeholder="e.g. Physics, Maths…"
            error={fieldErrors.subjectsStudying}
          />
        </div>
        <TagInput
          label="Learning Goals"
          items={resolved?.learningGoals ?? []}
          onChange={(v) => set('learningGoals', v)}
          placeholder="e.g. Pass A levels…"
        />
        <TagInput
          label="Weak Areas"
          items={resolved?.weakAreas ?? []}
          onChange={(v) => set('weakAreas', v)}
          placeholder="e.g. Integration, Organic Chemistry…"
        />
        <TagInput
          label="Strengths"
          items={resolved?.strengths ?? []}
          onChange={(v) => set('strengths', v)}
          placeholder="e.g. Algebra, Mechanics…"
        />
        <TagInput
          label="Learning Preferences"
          items={resolved?.learningPreferences ?? []}
          onChange={(v) => set('learningPreferences', v)}
          placeholder="e.g. Worked examples, Concise answers…"
        />

        {/* Notes (full-width) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
          <textarea
            value={resolved?.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any additional context for the AI tutor…"
            rows={3}
            className="w-full rounded-xl bg-black border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition resize-none"
          />
        </div>
      </div>

      {/* Footer: source badge + save button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {resolved?.source?.manuallyEdited && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              Manually edited
            </span>
          )}
          {resolved?.source?.aiUpdated && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
              AI-reviewed
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2 bg-white text-black text-sm font-medium hover:opacity-80 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Saving…
            </>
          ) : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ── Compact mode ──────────────────────────────────────────────────────── */
function CompactPanel() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-blue-900/30 px-3 py-2.5 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const hasProfile = profile && (profile.name || profile.educationalLevel);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-blue-900/30 px-3 py-2.5">
      {hasProfile ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-white truncate">{profile.name || 'Student'}</span>
            <div className="flex items-center gap-1.5">
              {profile.source?.aiUpdated && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/20 flex-shrink-0">
                  AI
                </span>
              )}
              {profile.educationalLevel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 flex-shrink-0">
                  {LEVEL_LABELS[profile.educationalLevel] ?? profile.educationalLevel}
                </span>
              )}
            </div>
          </div>
          {profile.subjectsStudying.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.subjectsStudying.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">
                  {s}
                </span>
              ))}
              {profile.subjectsStudying.length > 3 && (
                <span className="text-[10px] text-gray-600">+{profile.subjectsStudying.length - 3}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-gray-500">No profile yet</p>
      )}
      <Link
        href="/profile"
        className="mt-2 block text-[10px] text-blue-400 hover:text-blue-300 transition"
      >
        Review profile →
      </Link>
    </div>
  );
}

/* ── Exported component ────────────────────────────────────────────────── */
export default function StudentProfilePanel({ mode }: Props) {
  if (mode === 'compact') return <CompactPanel />;
  return <FullPanel />;
}
