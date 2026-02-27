import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { text, category, keyword, pointValue, order, isActive } = body;

  const data: Record<string, unknown> = {};
  if (text !== undefined) data.text = text;
  if (category !== undefined) data.category = category;
  if (keyword !== undefined) data.keyword = keyword;
  if (pointValue !== undefined) data.pointValue = pointValue;
  if (order !== undefined) data.order = order;
  if (isActive !== undefined) data.isActive = isActive;

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data,
  });

  return NextResponse.json(suggestion);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.suggestion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
