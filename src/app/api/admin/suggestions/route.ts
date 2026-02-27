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

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestions = await prisma.suggestion.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ suggestions });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { text, category, keyword, pointValue, order, isActive } = body;

  if (!text || !category || !keyword) {
    return NextResponse.json({ error: "text, category, keyword are required" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      text,
      category,
      keyword,
      pointValue: pointValue ?? 500,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(suggestion, { status: 201 });
}
