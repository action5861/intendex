import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MatchingService } from "@/services/matching.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") || undefined;

  const matches = await prisma.match.findMany({
    where: {
      intent: { userId: session.user.id },
      ...(status && { status }),
    },
    include: {
      intent: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ matches });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, action } = await req.json();

  try {
    if (action === "accept") {
      await MatchingService.acceptMatch(matchId, session.user.id);
    } else if (action === "reject") {
      await MatchingService.rejectMatch(matchId, session.user.id);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
