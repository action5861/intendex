import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/common/header";
import { RewardsContent } from "@/components/dashboard/rewards-content";

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="포인트" />
      <RewardsContent />
    </div>
  );
}
