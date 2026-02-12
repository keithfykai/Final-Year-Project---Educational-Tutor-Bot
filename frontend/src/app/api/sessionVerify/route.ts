import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ authenticated: true, uid: decoded.uid, email: decoded.email });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
