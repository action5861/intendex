import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UsersContent } from "@/components/admin/users-content";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <UsersContent />;
}
