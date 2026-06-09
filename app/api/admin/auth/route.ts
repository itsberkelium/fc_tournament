import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password) return NextResponse.json({ message: "Hatalı şifre." }, { status: 401 });

  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, role: "admin" });
  }

  const modPw = process.env.MODERATOR_PASSWORD;
  if (modPw && password === modPw) {
    return NextResponse.json({ success: true, role: "moderator" });
  }

  return NextResponse.json({ message: "Hatalı şifre." }, { status: 401 });
}
