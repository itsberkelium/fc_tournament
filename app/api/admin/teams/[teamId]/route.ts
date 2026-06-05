import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { teamId } = await params;

  await db.disabledTeam.upsert({
    where: { teamId },
    create: { teamId },
    update: {},
  });

  return NextResponse.json({ success: true, disabled: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const error = verifyAdminRequest(request);
  if (error) return error;

  const { teamId } = await params;

  await db.disabledTeam.deleteMany({ where: { teamId } });

  return NextResponse.json({ success: true, disabled: false });
}
