import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Constant-time string comparison to avoid leaking password length/contents via timing.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison against a same-length buffer to keep timing uniform.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// In-memory sliding-window rate limiter keyed by client IP. Best-effort: resets on
// process restart and is per-instance, but raises the cost of brute-forcing the
// password meaningfully for this single-container deployment.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(key, recent);
    return NextResponse.json(
      { message: "Çok fazla deneme. Lütfen biraz bekleyin." },
      { status: 429 }
    );
  }

  recent.push(now);
  attempts.set(key, recent);
  return null;
}

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}

export function verifyAdminRequest(request: NextRequest): NextResponse | null {
  const token = extractToken(request);
  const adminPw = process.env.ADMIN_PASSWORD;

  if (!token || !adminPw || !safeEqual(token, adminPw)) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  return null;
}

export function verifyStaffRequest(request: NextRequest): NextResponse | null {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });

  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw && safeEqual(token, adminPw)) return null;

  const modPw = process.env.MODERATOR_PASSWORD;
  if (modPw && safeEqual(token, modPw)) return null;

  return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
}
