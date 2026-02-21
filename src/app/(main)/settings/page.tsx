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
import { UserCircle, Bell, Shield, Smartphone } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0f172a] min-h-screen">
      <Header title="설정" />
      <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">환경설정</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">내 계정 정보를 확인하고 서비스 알림을 관리합니다.</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 opacity-80" />
            <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">계정 정보</CardTitle>
                  <CardDescription>소셜 로그인으로 연결된 내 프로필</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">이름 (닉네임)</label>
                  <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">{session.user.name ?? "-"}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">연결된 이메일</label>
                  <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">{session.user.email ?? "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-80" />
            <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">알림 설정</CardTitle>
                  <CardDescription>매칭 및 포인트 적립 알림</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50">
                <Smartphone className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                  알림 설정 기능은 <span className="text-indigo-500 dark:text-indigo-400">앱 출시</span>와 함께 업데이트 예정입니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-500 opacity-80" />
            <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                  <Shield className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">보안 및 개인정보</CardTitle>
                  <CardDescription>인텐덱스는 유저의 데이터를 안전하게 보호합니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <div className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                <p>회원님의 대화와 의도 데이터는 익명화되어 철저하게 관리되며, 동의 없이 제3자에게 제공되지 않습니다.</p>
                <p>계정 탈퇴 및 데이터 삭제 문의는 고객센터를 통해 접수해 주세요.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
