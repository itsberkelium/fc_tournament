import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Hatalı şifre." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
