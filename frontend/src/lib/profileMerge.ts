import type { StudentProfile } from '@/types/profile';
import type { ProfileRefreshField } from '@/lib/profileRefreshApi';

const ARRAY_FIELDS = [
  'subjectsStudying',
  'learningGoals',
  'weakAreas',
  'strengths',
  'learningPreferences',
] as const;

const SCALAR_FIELDS = ['name', 'educationalLevel', 'notes', 'profileSummary'] as const;

type ArrayField = (typeof ARRAY_FIELDS)[number];
type ScalarField = (typeof SCALAR_FIELDS)[number];

export type ProfilePreviewEntry =
  | {
      field: ScalarField;
      label: string;
      type: 'scalar';
      kind: 'set' | 'replace';
      current: string;
      suggested: string;
      confidence?: number;
    }
  | {
      field: ArrayField;
      label: string;
      type: 'array';
      current: string[];
      suggested: string[];
      added: string[];
      unchanged: string[];
      confidence?: number;
    };

const FIELD_LABELS: Record<ProfileRefreshField, string> = {
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

function normalizeScalar(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function mergeStringArray(existing: string[] = [], incoming: string[] = []) {
  const merged = [...existing, ...incoming]
    .map((item) => item.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of merged) {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function mergeStudentProfile(
  existingProfile: StudentProfile,
  suggestedPatch: Partial<StudentProfile>,
) {
  const now = new Date().toISOString();
  const merged: StudentProfile = {
    ...existingProfile,
    source: {
      ...(existingProfile.source ?? {}),
      aiUpdated: true,
      lastAiUpdateAt: now,
    },
    updatedAt: now,
  };

  for (const field of ARRAY_FIELDS) {
    const incoming = Array.isArray(suggestedPatch[field]) ? (suggestedPatch[field] as string[]) : [];
    if (incoming.length === 0) continue;
    merged[field] = mergeStringArray(existingProfile[field], incoming);
  }

  for (const field of SCALAR_FIELDS) {
    const incoming = normalizeScalar(suggestedPatch[field]);
    if (!incoming) continue;
    merged[field] = incoming;
  }

  return merged;
}

export function buildProfileUpdatePreview(
  existingProfile: StudentProfile,
  suggestedPatch: Partial<StudentProfile>,
  confidence?: Partial<Record<ProfileRefreshField, number>>,
) {
  const preview: ProfilePreviewEntry[] = [];

  for (const field of SCALAR_FIELDS) {
    const suggested = normalizeScalar(suggestedPatch[field]);
    if (!suggested) continue;

    const current = normalizeScalar(existingProfile[field]);
    if (current === suggested) continue;

    preview.push({
      field,
      label: FIELD_LABELS[field],
      type: 'scalar',
      kind: current ? 'replace' : 'set',
      current,
      suggested,
      confidence: confidence?.[field],
    });
  }

  for (const field of ARRAY_FIELDS) {
    const current = mergeStringArray(existingProfile[field], []);
    const incoming = Array.isArray(suggestedPatch[field]) ? (suggestedPatch[field] as string[]) : [];
    if (incoming.length === 0) continue;

    const suggested = mergeStringArray(current, incoming);
    const currentKeys = new Set(current.map((item) => item.toLocaleLowerCase()));
    const added = suggested.filter((item) => !currentKeys.has(item.toLocaleLowerCase()));

    if (added.length === 0) continue;

    preview.push({
      field,
      label: FIELD_LABELS[field],
      type: 'array',
      current,
      suggested,
      added,
      unchanged: suggested.filter((item) => currentKeys.has(item.toLocaleLowerCase())),
      confidence: confidence?.[field],
    });
  }

  return preview;
}
