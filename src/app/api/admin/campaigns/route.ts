import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { EmbeddingService } from "@/services/embedding.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 20;

  const where = status ? { status } : {};

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return NextResponse.json({
    campaigns,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const {
    title,
    description,
    category,
    keywords,
    budget,
    costPerMatch,
    startDate,
    endDate,
    url,
    siteName,
  } = body;

  if (
    !title ||
    !description ||
    !category ||
    !keywords?.length ||
    !budget ||
    !costPerMatch ||
    !startDate ||
    !endDate
  ) {
    return NextResponse.json(
      { error: "필수 항목을 모두 입력해주세요" },
      { status: 400 }
    );
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json(
      { error: "종료일은 시작일 이후여야 합니다" },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description,
      category,
      keywords,
      budget: Number(budget),
      costPerMatch: Number(costPerMatch),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      url: url || null,
      siteName: siteName || null,
    },
  });

  // 임베딩 생성 및 저장
  let embeddingWarning: string | undefined;
  try {
    const text = EmbeddingService.buildCampaignText({ title, description, category, keywords });
    const embedding = await EmbeddingService.embed(text);
    const vectorStr = EmbeddingService.toVectorLiteral(embedding);
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "Campaign" SET embedding = ${vectorStr}::vector WHERE id = ${campaign.id}`
    );
  } catch (err) {
    console.error("[Campaign POST] 임베딩 생성 실패:", err);
    embeddingWarning = "캠페인은 등록됐지만 AI 임베딩 생성에 실패했습니다. 매칭 품질이 저하될 수 있습니다.";
  }

  return NextResponse.json(
    { ...campaign, _warning: embeddingWarning },
    { status: 201 }
  );
}
