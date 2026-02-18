import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/common/header";
import { IntentsContent } from "@/components/dashboard/intents-content";

export default async function IntentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="내 의도" />
      <IntentsContent />
    </div>
  );
}
