import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { EmbeddingService } from "@/services/embedding.service";

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

  // 임베딩 관련 필드(title/description/category/keywords)가 바뀐 경우에만 재생성
  const needsReembed = body.title || body.description || body.category || body.keywords;
  let embeddingWarning: string | undefined;
  if (needsReembed) {
    try {
      const text = EmbeddingService.buildCampaignText({
        title: updated.title,
        description: updated.description,
        category: updated.category,
        keywords: updated.keywords,
      });
      const embedding = await EmbeddingService.embed(text);
      const vectorStr = EmbeddingService.toVectorLiteral(embedding);
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "Campaign" SET embedding = ${vectorStr}::vector WHERE id = ${id}`
      );
    } catch (err) {
      console.error("[Campaign PATCH] 임베딩 재생성 실패:", err);
      embeddingWarning = "캠페인은 수정됐지만 AI 임베딩 재생성에 실패했습니다. 매칭 품질이 저하될 수 있습니다.";
    }
  }

  return NextResponse.json({ ...updated, _warning: embeddingWarning });
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
