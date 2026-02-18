import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if already received stay bonus
  const existing = await prisma.transaction.findFirst({
    where: {
      userId,
      type: "earn",
      metadata: { path: ["source"], equals: "settings_stay_bonus" },
    },
  });

  if (existing) {
    return NextResponse.json({ already: true });
  }

  // Grant 1000P
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: 1000 } },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type: "earn",
      amount: 1000,
      balance: updated.points,
      metadata: { source: "settings_stay_bonus" },
    },
  });

  return NextResponse.json({ granted: true, newBalance: updated.points });
}
