import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { checkRateLimit } from "@/lib/admin-guard";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { password } = await request.json().catch(() => ({ password: undefined }));

  if (!password || typeof password !== "string") {
    return NextResponse.json({ message: "Hatalı şifre." }, { status: 401 });
  }

  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw && safeEqual(password, adminPw)) {
    return NextResponse.json({ success: true, role: "admin" });
  }

  const modPw = process.env.MODERATOR_PASSWORD;
  if (modPw && safeEqual(password, modPw)) {
    return NextResponse.json({ success: true, role: "moderator" });
  }

  return NextResponse.json({ message: "Hatalı şifre." }, { status: 401 });
}
