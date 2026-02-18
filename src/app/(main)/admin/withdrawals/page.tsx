import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WithdrawalsContent } from "@/components/admin/withdrawals-content";

export default async function AdminWithdrawalsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <WithdrawalsContent />;
}
