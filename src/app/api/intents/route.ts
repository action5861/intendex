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
