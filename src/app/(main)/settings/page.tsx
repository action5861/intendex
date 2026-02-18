import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/common/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="설정" />
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>연결된 소셜 계정 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                이름
              </label>
              <p className="text-sm">{session.user.name ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                이메일
              </label>
              <p className="text-sm">{session.user.email ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>매칭 알림 및 포인트 알림 설정</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              추후 업데이트 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
