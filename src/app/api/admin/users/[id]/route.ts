import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      points: true,
      createdAt: true,
      intents: {
        select: {
          id: true,
          category: true,
          keyword: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      transactions: {
        select: {
          id: true,
          type: true,
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { intents: true, transactions: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  if (body.role && (body.role === "user" || body.role === "admin")) {
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "자신의 역할은 변경할 수 없습니다" },
        { status: 400 }
      );
    }
    updateData.role = body.role;
  }

  if (typeof body.pointsAdjustment === "number" && body.pointsAdjustment !== 0) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { points: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newPoints = user.points + body.pointsAdjustment;
    if (newPoints < 0) {
      return NextResponse.json(
        { error: "포인트가 0 미만이 될 수 없습니다" },
        { status: 400 }
      );
    }

    updateData.points = newPoints;

    await prisma.transaction.create({
      data: {
        userId: id,
        type: body.pointsAdjustment > 0 ? "earn" : "withdraw",
        amount: body.pointsAdjustment,
        balance: newPoints,
        metadata: { reason: "관리자 수동 조정", adminId: session.user.id },
      },
    });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      points: true,
    },
  });

  return NextResponse.json(updated);
}
