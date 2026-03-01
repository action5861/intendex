import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { IntentService } from "@/services/intent.service";
import { MatchingService } from "@/services/matching.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");

  const result = await IntentService.getUserIntents(session.user.id, {
    category,
    status,
    page,
  });

  // Run matching for active intents in the background
  MatchingService.runMatchingForUser(session.user.id).catch(() => {});

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { intentId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { intentId } = body;
  if (!intentId) {
    return NextResponse.json({ error: "intentId is required" }, { status: 400 });
  }

  const result = await IntentService.deleteIntent(intentId, session.user.id);
  if (result.count === 0) {
    return NextResponse.json(
      { error: "의도를 찾을 수 없거나 이미 삭제되었습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
