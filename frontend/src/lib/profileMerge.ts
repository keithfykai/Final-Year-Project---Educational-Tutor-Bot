import type { StudentProfile, ProfileChangeLogEntry } from '@/types/profile';
import type { ProfileRefreshField, ProfilePatchAction } from '@/lib/profileRefreshApi';

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

function removeFromStringArray(existing: string[] = [], toRemove: string | string[]): string[] {
  const removeSet = new Set(
    (Array.isArray(toRemove) ? toRemove : [toRemove]).map((s) => s.toLocaleLowerCase()),
  );
  return existing.filter((item) => !removeSet.has(item.toLocaleLowerCase()));
}

export function mergeStudentProfile(
  existingProfile: StudentProfile,
  suggestedPatch: Partial<StudentProfile>,
  options?: {
    patchActions?: ProfilePatchAction[];
    confidence?: Partial<Record<ProfileRefreshField, number>>;
  },
) {
  const now = new Date().toISOString();
  const manuallyEditedFields = existingProfile.source?.manuallyEditedFields ?? [];

  const merged: StudentProfile = {
    ...existingProfile,
    source: {
      ...(existingProfile.source ?? {}),
      aiUpdated: true,
      lastAiUpdateAt: now,
    },
    updatedAt: now,
  };

  const changeLogEntries: ProfileChangeLogEntry[] = [];

  // Apply delete actions first (bypass protection)
  if (options?.patchActions) {
    for (const action of options.patchActions) {
      if (action.action !== 'delete') continue;
      const field = action.field;

      if (ARRAY_FIELDS.includes(field as ArrayField)) {
        const before = [...(existingProfile[field as ArrayField] ?? [])];
        const after = action.value
          ? removeFromStringArray(before, action.value)
          : [];
        if (before.join('|') !== after.join('|')) {
          (merged as Record<string, unknown>)[field] = after;
          changeLogEntries.push({ timestamp: now, field, before, after, source: 'ai' });
        }
      } else if (SCALAR_FIELDS.includes(field as ScalarField)) {
        const before = normalizeScalar(existingProfile[field as ScalarField]);
        if (before) {
          (merged as Record<string, unknown>)[field] = '';
          changeLogEntries.push({ timestamp: now, field, before, after: '', source: 'ai' });
        }
      }
    }
  }

  // Apply add/update from patchActions (respects protection)
  if (options?.patchActions) {
    for (const action of options.patchActions) {
      if (action.action === 'delete') continue;
      const field = action.field;
      const isProtected = manuallyEditedFields.includes(field);
      const confidence = options.confidence?.[field] ?? 0;

      if (isProtected && confidence < 0.85) continue;

      if (ARRAY_FIELDS.includes(field as ArrayField) && action.value) {
        const incoming = Array.isArray(action.value) ? action.value : [action.value as string];
        const before = [...(existingProfile[field as ArrayField] ?? [])];
        const after = mergeStringArray(before, incoming);
        const added = after.filter(
          (item) => !before.map((b) => b.toLocaleLowerCase()).includes(item.toLocaleLowerCase()),
        );
        if (added.length > 0) {
          (merged as Record<string, unknown>)[field] = after;
          changeLogEntries.push({ timestamp: now, field, before, after, source: 'ai' });
        }
      } else if (SCALAR_FIELDS.includes(field as ScalarField) && action.value) {
        const incoming = normalizeScalar(action.value);
        if (!incoming) continue;
        const before = normalizeScalar(existingProfile[field as ScalarField]);
        if (before !== incoming) {
          (merged as Record<string, unknown>)[field] = incoming;
          changeLogEntries.push({ timestamp: now, field, before, after: incoming, source: 'ai' });
        }
      }
    }
  } else {
    // Fall back to suggestedPatch when no patchActions
    for (const field of ARRAY_FIELDS) {
      const incoming = Array.isArray(suggestedPatch[field]) ? (suggestedPatch[field] as string[]) : [];
      if (incoming.length === 0) continue;

      const isProtected = manuallyEditedFields.includes(field);
      const confidence = options?.confidence?.[field] ?? 0;
      if (isProtected && confidence < 0.85) continue;

      const before = [...(existingProfile[field] ?? [])];
      const after = mergeStringArray(before, incoming);
      const added = after.filter(
        (item) => !before.map((b) => b.toLocaleLowerCase()).includes(item.toLocaleLowerCase()),
      );
      if (added.length > 0) {
        merged[field] = after;
        changeLogEntries.push({ timestamp: now, field, before, after, source: 'ai' });
      }
    }

    for (const field of SCALAR_FIELDS) {
      const incoming = normalizeScalar(suggestedPatch[field]);
      if (!incoming) continue;

      const isProtected = manuallyEditedFields.includes(field);
      const confidence = options?.confidence?.[field] ?? 0;
      if (isProtected && confidence < 0.85) continue;

      const before = normalizeScalar(existingProfile[field]);
      if (before !== incoming) {
        merged[field] = incoming;
        changeLogEntries.push({ timestamp: now, field, before, after: incoming, source: 'ai' });
      }
    }
  }

  if (changeLogEntries.length > 0) {
    merged.changeLog = [...changeLogEntries, ...(existingProfile.changeLog ?? [])].slice(0, 10);
  }

  return merged;
}

export function buildProfileUpdatePreview(
  existingProfile: StudentProfile,
  suggestedPatch: Partial<StudentProfile>,
  confidence?: Partial<Record<ProfileRefreshField, number>>,
) {
  const preview: ProfilePreviewEntry[] = [];
  const manuallyEditedFields = existingProfile.source?.manuallyEditedFields ?? [];

  for (const field of SCALAR_FIELDS) {
    const suggested = normalizeScalar(suggestedPatch[field]);
    if (!suggested) continue;

    const current = normalizeScalar(existingProfile[field]);
    if (current === suggested) continue;

    const isProtected = manuallyEditedFields.includes(field);
    const fieldConfidence = confidence?.[field] ?? 0;
    if (isProtected && fieldConfidence < 0.85) continue;

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

    const isProtected = manuallyEditedFields.includes(field);
    const fieldConfidence = confidence?.[field] ?? 0;
    if (isProtected && fieldConfidence < 0.85) continue;

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
