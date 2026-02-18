import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CampaignsContent } from "@/components/admin/campaigns-content";

export default async function AdminCampaignsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <CampaignsContent />;
}
