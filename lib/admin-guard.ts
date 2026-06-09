import { NextRequest, NextResponse } from "next/server";

export function verifyAdminRequest(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  return null;
}

export function verifyStaffRequest(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token) return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  if (token === process.env.ADMIN_PASSWORD) return null;

  const modPw = process.env.MODERATOR_PASSWORD;
  if (modPw && token === modPw) return null;

  return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
}
