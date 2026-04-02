import type { StudentProfile } from '@/types/profile';

export const PROFILE_REFRESH_FIELDS = [
  'name',
  'educationalLevel',
  'subjectsStudying',
  'learningGoals',
  'weakAreas',
  'strengths',
  'learningPreferences',
  'notes',
  'profileSummary',
] as const;

export type ProfileRefreshField = (typeof PROFILE_REFRESH_FIELDS)[number];

export type ProfileRefreshMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ProfileRefreshRequest = {
  sessionId: string;
  messages: ProfileRefreshMessage[];
  existingProfile: Partial<StudentProfile> | null;
};

export type ProfileRefreshResult = {
  shouldUpdateProfile: boolean;
  reasonNoUpdate: string | null;
  sessionSummary: string;
  suggestedPatch: Partial<Pick<StudentProfile, ProfileRefreshField>>;
  confidence?: Partial<Record<ProfileRefreshField, number>>;
  warnings: string[];
  detectedTopics: string[];
};

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeString(item))
    .filter(Boolean);
}

export function sanitizeSuggestedPatch(value: unknown): ProfileRefreshResult['suggestedPatch'] {
  if (!value || typeof value !== 'object') return {};

  const raw = value as Record<string, unknown>;
  const patch: ProfileRefreshResult['suggestedPatch'] = {};

  for (const field of PROFILE_REFRESH_FIELDS) {
    if (!(field in raw)) continue;

    if (
      field === 'subjectsStudying' ||
      field === 'learningGoals' ||
      field === 'weakAreas' ||
      field === 'strengths' ||
      field === 'learningPreferences'
    ) {
      patch[field] = sanitizeStringArray(raw[field]);
      continue;
    }

    const sanitized = sanitizeString(raw[field]);
    if (sanitized) {
      patch[field] = sanitized;
    }
  }

  return patch;
}

export function sanitizeConfidence(value: unknown): ProfileRefreshResult['confidence'] | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const raw = value as Record<string, unknown>;
  const confidence: Partial<Record<ProfileRefreshField, number>> = {};

  for (const field of PROFILE_REFRESH_FIELDS) {
    const score = raw[field];
    if (typeof score === 'number' && Number.isFinite(score)) {
      confidence[field] = Math.max(0, Math.min(1, score));
    }
  }

  return Object.keys(confidence).length > 0 ? confidence : undefined;
}

export function normalizeProfileRefreshResult(value: unknown): ProfileRefreshResult {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    shouldUpdateProfile: typeof raw.shouldUpdateProfile === 'boolean' ? raw.shouldUpdateProfile : false,
    reasonNoUpdate: sanitizeString(raw.reasonNoUpdate) || null,
    sessionSummary: sanitizeString(raw.sessionSummary),
    suggestedPatch: sanitizeSuggestedPatch(raw.suggestedPatch),
    confidence: sanitizeConfidence(raw.confidence),
    warnings: sanitizeStringArray(raw.warnings),
    detectedTopics: sanitizeStringArray(raw.detectedTopics),
  };
}

export async function refreshProfileFromSession(payload: ProfileRefreshRequest): Promise<ProfileRefreshResult> {
  const response = await fetch('/api/profile/refresh-from-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Failed to refresh profile from this chat.';
    throw new Error(message);
  }

  return normalizeProfileRefreshResult(data);
}
