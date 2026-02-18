import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.title) updateData.title = body.title;
  if (body.description) updateData.description = body.description;
  if (body.category) updateData.category = body.category;
  if (body.keywords) updateData.keywords = body.keywords;
  if (body.budget) updateData.budget = Number(body.budget);
  if (body.costPerMatch) updateData.costPerMatch = Number(body.costPerMatch);
  if (body.startDate) updateData.startDate = new Date(body.startDate);
  if (body.endDate) updateData.endDate = new Date(body.endDate);
  if (body.status && ["active", "paused", "completed"].includes(body.status)) {
    updateData.status = body.status;
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const matchCount = await prisma.match.count({ where: { campaignId: id } });
  if (matchCount > 0) {
    return NextResponse.json(
      { error: "매칭이 존재하는 캠페인은 삭제할 수 없습니다" },
      { status: 400 }
    );
  }

  await prisma.campaign.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
