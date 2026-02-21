import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["completed", "rejected"]),
});

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
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction || transaction.type !== "withdraw") {
    return NextResponse.json({ error: "출금 건을 찾을 수 없습니다" }, { status: 404 });
  }

  const metadata = transaction.metadata as Record<string, unknown> | null;
  if (metadata?.status !== "pending") {
    return NextResponse.json({ error: "이미 처리된 출금 건입니다" }, { status: 400 });
  }

  const newStatus = parsed.data.status;

  if (newStatus === "rejected") {
    // Refund points + update transaction status + create refund record
    await prisma.$transaction(async (tx) => {
      // Update original withdrawal transaction status
      await tx.transaction.update({
        where: { id },
        data: {
          metadata: { ...metadata, status: "rejected" },
        },
      });

      // Refund points to user
      const updated = await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: transaction.amount } },
      });

      // Create refund transaction record
      await tx.transaction.create({
        data: {
          userId: transaction.userId,
          type: "earn",
          amount: transaction.amount,
          balance: updated.points,
          source: "withdrawal_refund",
          refId: id,
          metadata: { source: "withdrawal_refund", originalTransactionId: id },
        },
      });
    });
  } else {
    // Mark as completed
    await prisma.transaction.update({
      where: { id },
      data: {
        metadata: { ...metadata, status: "completed" },
      },
    });
  }

  return NextResponse.json({ success: true });
}
