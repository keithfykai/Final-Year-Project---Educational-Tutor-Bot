import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { EMPTY_PROFILE, type StudentProfile } from "@/types/profile";

async function getUidFromRequest(request: NextRequest): Promise<string | null> {
  // Try session cookie first
  const sessionCookie = request.cookies.get("__session")?.value;
  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      return decoded.uid;
    } catch { /* fall through to ID token */ }
  }

  // Fallback: Firebase ID token in Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      return decoded.uid;
    } catch { /* invalid token */ }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const uid = await getUidFromRequest(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminFirestore();
    const docRef = db.doc(`users/${uid}/profile/main`);
    const snap = await docRef.get();

    const data = snap.exists ? snap.data() : {};
    const profile: StudentProfile = {
      userId: uid,
      ...EMPTY_PROFILE,
      ...(data as Partial<StudentProfile>),
    };

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const uid = await getUidFromRequest(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<StudentProfile>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Strip userId from the write payload — it's derived from the session
  const { userId: _stripped, ...updates } = body as StudentProfile;

  const now = new Date().toISOString();
  const payload = {
    ...updates,
    updatedAt: now,
    source: {
      ...(updates.source ?? {}),
      manuallyEdited: true,
    },
  };

  try {
    const db = getAdminFirestore();
    const docRef = db.doc(`users/${uid}/profile/main`);
    const snap = await docRef.get();

    if (!snap.exists) {
      await docRef.set({ ...EMPTY_PROFILE, ...payload, createdAt: now, userId: uid });
    } else {
      await docRef.set(payload, { merge: true });
    }

    const updated = await docRef.get();
    const profile: StudentProfile = {
      userId: uid,
      ...EMPTY_PROFILE,
      ...(updated.data() as Partial<StudentProfile>),
    };

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[PUT /api/profile]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
