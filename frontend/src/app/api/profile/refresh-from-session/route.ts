import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  normalizeProfileRefreshResult,
  type ProfileRefreshMessage,
} from '@/lib/profileRefreshApi';
import type { StudentProfile } from '@/types/profile';

type RequestBody = {
  sessionId?: unknown;
  messages?: unknown;
  existingProfile?: unknown;
};

function getBackendBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return url ? url.replace(/\/+$/, '') : '';
}

function sanitizeMessages(value: unknown): ProfileRefreshMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const role = raw.role;
      const content = typeof raw.content === 'string' ? raw.content.trim() : '';
      if (!content) return null;
      if (role !== 'user' && role !== 'assistant' && role !== 'system') return null;
      return { role, content };
    })
    .filter((item): item is ProfileRefreshMessage => item !== null);
}

function sanitizeExistingProfile(value: unknown): Partial<StudentProfile> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Partial<StudentProfile>;
}

export async function POST(request: NextRequest) {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    return NextResponse.json(
      { error: 'Profile refresh is not configured yet. Add NEXT_PUBLIC_BACKEND_URL first.' },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const messages = sanitizeMessages(body.messages);
  const existingProfile = sanitizeExistingProfile(body.existingProfile);

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: 'No chat messages were available for analysis.' }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${backendBaseUrl}/llm/profile/refresh-from-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages, existingProfile }),
      cache: 'no-store',
    });

    const backendData = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      const message =
        backendData &&
        typeof backendData === 'object' &&
        typeof (backendData as { error?: unknown }).error === 'string'
          ? (backendData as { error: string }).error
          : 'The backend could not analyze this chat for profile updates.';

      return NextResponse.json({ error: message }, { status: backendResponse.status || 502 });
    }

    return NextResponse.json(normalizeProfileRefreshResult(backendData));
  } catch (error) {
    console.error('[POST /api/profile/refresh-from-session]', error);
    return NextResponse.json(
      { error: 'Could not reach the profile refresh service right now.' },
      { status: 502 },
    );
  }
}
