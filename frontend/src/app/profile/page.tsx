'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuthClient } from '../../../firebase/firebaseClient';
import { UserCircle, ChevronLeft, Code, History } from 'lucide-react';
import StudentProfilePanel from '@/components/StudentProfilePanel';
import { useProfile } from '@/hooks/useProfile';
import type { ProfileChangeLogEntry } from '@/types/profile';

function ChangeLogViewer() {
  const { profile, loading } = useProfile();
  const [open, setOpen] = useState(false);

  if (loading || !profile?.changeLog?.length) return null;

  const FIELD_LABELS: Record<string, string> = {
    name: 'Name',
    educationalLevel: 'Educational Level',
    subjectsStudying: 'Subjects Studying',
    learningGoals: 'Learning Goals',
    weakAreas: 'Weak Areas',
    strengths: 'Strengths',
    learningPreferences: 'Learning Preferences',
    notes: 'Notes',
    profileSummary: 'Profile Summary',
  };

  const formatValue = (v: ProfileChangeLogEntry['before']) =>
    Array.isArray(v) ? v.join(', ') || '—' : v || '—';

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/30 to-black/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-400 hover:text-white transition"
      >
        <span className="flex items-center gap-2">
          <History size={15} />
          Recent profile changes
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
            {profile.changeLog.length}
          </span>
        </span>
        <span className="text-gray-600 text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-800 px-6 py-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">When</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Field</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">Before</th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">After</th>
                <th className="pb-2 font-medium whitespace-nowrap">Source</th>
              </tr>
            </thead>
            <tbody>
              {profile.changeLog.map((entry, i) => (
                <tr key={i} className="border-b border-gray-900 align-top">
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">
                    {FIELD_LABELS[entry.field] ?? entry.field}
                  </td>
                  <td className="py-2 pr-4 text-gray-500 max-w-[150px] truncate">
                    {formatValue(entry.before)}
                  </td>
                  <td className="py-2 pr-4 text-white max-w-[150px] truncate">
                    {formatValue(entry.after)}
                  </td>
                  <td className="py-2">
                    {entry.source === 'ai' ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800">
                        AI
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        You
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RawDocViewer() {
  const { profile, loading } = useProfile();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/30 to-black/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-400 hover:text-white transition"
      >
        <span className="flex items-center gap-2">
          <Code size={15} />
          View raw profile document
        </span>
        <span className="text-gray-600 text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-800 px-6 py-4">
          <p className="text-xs text-gray-500 mb-3">
            This document is stored in the Database, certain fields have been redacted for privacy. It is used by the system to personalise your learning experience. You can edit this document by updating the form above.
            {/* <code className="text-gray-400">users/{'{uid}'}/profile/main</code>. */}
          </p>
          <pre className="text-xs text-green-300 bg-black rounded-xl p-4 overflow-x-auto leading-relaxed">
            {JSON.stringify(
              profile ? (({ name, educationalLevel, subjectsStudying, learningGoals, weakAreas, strengths, learningPreferences, notes, profileSummary, createdAt, source, updatedAt }) =>
                ({ name, educationalLevel, subjectsStudying, learningGoals, weakAreas, strengths, learningPreferences, notes, profileSummary, createdAt, source, updatedAt })
              )(profile) : null,
              null, 2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new') === 'true';
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuthClient();
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
      if (!user) router.replace('/signin');
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft size={18} />
            <span className="text-sm">Back</span>
          </Link>
          <div className="w-px h-5 bg-gray-800" />
          <Link href="/dashboard" className="flex items-center gap-2">
            <UserCircle size={18} className="text-white" />
            <span className="font-bold text-base text-white">Eduble</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/Eddy.png" alt="Eduble" width={28} height={28} className="rounded-full" />
          <span className="text-sm text-gray-400 hidden sm:block">{authUser.email}</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNewUser ? 'Set up your Learning Profile' : 'Learning Profile'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isNewUser
              ? 'Tell Eduble about yourself so it can personalise your learning experience from the start.'
              : 'Manage how Eduble understands your learning style and goals.'}
          </p>
          {isNewUser && (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-xs text-gray-500">
                You can always skip this and fill it in later from the Dashboard.
              </p>
              <Link
                href="/dashboard"
                className="text-xs text-gray-400 hover:text-white underline transition flex-shrink-0"
              >
                Skip for now →
              </Link>
            </div>
          )}
        </div>

        <StudentProfilePanel mode="full" />

        <ChangeLogViewer />

        <RawDocViewer />
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ProfilePageInner />
    </Suspense>
  );
}
