'use client';

import type { StudentProfile } from '@/types/profile';
import type { ProfileRefreshResult } from '@/lib/profileRefreshApi';
import type { ProfilePreviewEntry } from '@/lib/profileMerge';

type Props = {
  open: boolean;
  result: ProfileRefreshResult | null;
  preview: ProfilePreviewEntry[];
  existingProfile: StudentProfile | null;
  applying: boolean;
  error: string | null;
  onApply: () => void;
  onClose: () => void;
};

function formatConfidence(score?: number) {
  if (typeof score !== 'number') return null;
  return `${Math.round(score * 100)}% confidence`;
}

function renderList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return <p className="text-xs text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-gray-700 bg-black px-2.5 py-1 text-xs text-gray-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ProfileUpdateReviewModal({
  open,
  result,
  preview,
  existingProfile,
  applying,
  error,
  onApply,
  onClose,
}: Props) {
  if (!open || !result || !existingProfile) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-update-review-title"
        className="max-h-full w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-800 bg-[#050816] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">
              Update Profile From Chat
            </p>
            <h2 id="profile-update-review-title" className="mt-1 text-xl font-semibold text-white">
              Review suggested profile changes
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              This update is based on your recent conversation. Review the suggested changes before saving
              them to your profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-500 hover:text-white disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <section className="rounded-2xl border border-blue-900/40 bg-blue-950/20 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-300">Session Summary</p>
            <p className="mt-2 text-sm leading-6 text-gray-200">
              {result.sessionSummary || 'The backend did not return a summary for this chat.'}
            </p>
            {result.detectedTopics.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-blue-300">Detected Topics</p>
                <div className="mt-2">{renderList(result.detectedTopics, 'No detected topics')}</div>
              </div>
            )}
          </section>

          {!result.shouldUpdateProfile && result.reasonNoUpdate && (
            <section className="mt-5 rounded-2xl border border-amber-900/40 bg-amber-950/20 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-300">No Update Applied</p>
              <p className="mt-2 text-sm text-amber-100">{result.reasonNoUpdate}</p>
            </section>
          )}

          {result.warnings.length > 0 && (
            <section className="mt-5 rounded-2xl border border-amber-900/40 bg-black/40 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Warnings</p>
              <div className="mt-3 space-y-2">
                {result.warnings.map((warning) => (
                  <p key={warning} className="text-sm text-gray-200">
                    {warning}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 space-y-4">
            {preview.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-black/40 px-5 py-4">
                <p className="text-sm text-gray-300">No meaningful profile changes are pending.</p>
              </div>
            ) : (
              preview.map((entry) => {
                const confidenceLabel = formatConfidence(entry.confidence);

                return (
                  <div key={entry.field} className="rounded-2xl border border-gray-800 bg-black/40 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{entry.label}</h3>
                      {entry.type === 'scalar' && (
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-300">
                          {entry.kind === 'replace' ? 'Replace' : 'Set'}
                        </span>
                      )}
                      {confidenceLabel && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                          {confidenceLabel}
                        </span>
                      )}
                    </div>

                    {entry.type === 'scalar' ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-800 bg-[#080b18] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Current</p>
                          <p className="mt-1 text-sm text-gray-200">{entry.current || 'Not set'}</p>
                        </div>
                        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-blue-300">Suggested</p>
                          <p className="mt-1 text-sm text-white">{entry.suggested}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-800 bg-[#080b18] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Current</p>
                          <div className="mt-2">{renderList(entry.current, 'No current values')}</div>
                        </div>
                        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-blue-300">Will be added</p>
                          <div className="mt-2">{renderList(entry.added, 'No new values')}</div>
                          {entry.unchanged.length > 0 && (
                            <>
                              <p className="mt-3 text-[11px] uppercase tracking-wide text-gray-500">
                                Existing values kept
                              </p>
                              <div className="mt-2">{renderList(entry.unchanged, 'No existing values kept')}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 px-6 py-4">
          <p className="text-xs text-gray-500">
            Your profile will only change after you apply these suggestions.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={applying || preview.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:opacity-85 disabled:opacity-50"
            >
              {applying ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Saving…
                </>
              ) : (
                `Apply ${preview.length} change${preview.length === 1 ? '' : 's'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
