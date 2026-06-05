import { NextRequest, NextResponse } from "next/server";

export function verifyAdminRequest(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  return null;
}
