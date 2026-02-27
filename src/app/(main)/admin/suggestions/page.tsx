import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuggestionsContent } from "@/components/admin/suggestions-content";

export default async function AdminSuggestionsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <SuggestionsContent />;
}
