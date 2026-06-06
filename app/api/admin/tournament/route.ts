import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function DELETE(request: NextRequest) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  await db.match.deleteMany();

  return NextResponse.json({ success: true });
}
