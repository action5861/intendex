"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  MessageSquare,
  LayoutDashboard,
  Lightbulb,
  Coins,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Users,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/chat", label: "AI 채팅", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { href: "/intents", label: "내 의도", icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10" },
  { href: "/rewards", label: "포인트", icon: Coins, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { href: "/settings", label: "설정", icon: Settings, color: "text-slate-400", bg: "bg-slate-500/10" },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-full flex-col bg-[#0f172a] border-r border-slate-800/60 shadow-2xl relative overflow-hidden">
      {/* Background blobs for sidebar */}
      <div className="absolute top-0 left-0 w-full h-40 bg-blue-600/5 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-40 bg-indigo-600/5 blur-[60px] pointer-events-none" />

      <div className="p-6 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onNavigate}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[15px] shadow-lg shadow-blue-900/40 ring-2 ring-white/10 group-hover:scale-105 transition-transform duration-300">
            IX
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-blue-200 transition-colors">인텐덱스</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto w-full relative z-10 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-bold transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "text-white bg-slate-800/80 shadow-inner border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn("p-1.5 rounded-lg transition-colors duration-300", isActive ? item.bg : "bg-transparent group-hover:bg-slate-700/50")}>
                <item.icon className={cn("h-4 w-4", isActive ? item.color : "text-slate-400 group-hover:text-slate-300")} />
              </div>
              {item.label}
            </Link>
          );
        })}

        {session?.user?.role === "admin" && (
          <>
            <div className="my-4 mx-2 border-t border-slate-800/80" />
            <div className="px-3 mb-2 text-[11px] font-black text-slate-500 tracking-wider">ADMINISTRATION</div>
            {[
              { href: "/admin/users", label: "사용자 관리", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
              { href: "/admin/campaigns", label: "광고주 관리", icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10" },
              { href: "/admin/withdrawals", label: "출금 관리", icon: ShieldCheck, color: "text-rose-400", bg: "bg-rose-500/10" },
            ].map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-bold transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "text-white bg-slate-800/80 shadow-inner border border-slate-700/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicatorAdmin"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-purple-500 rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={cn("p-1.5 rounded-lg transition-colors duration-300", isActive ? item.bg : "bg-transparent group-hover:bg-slate-700/50")}>
                    <item.icon className={cn("h-4 w-4", isActive ? item.color : "text-slate-400 group-hover:text-slate-300")} />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 relative z-10 mt-auto">
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-md">
          {session?.user && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-slate-700/80 shadow-sm">
                <AvatarImage src={session.user.image ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold">
                  {session.user.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate text-slate-100">
                  {session.user.name}
                </p>
                <p className="text-[11px] font-medium text-slate-400 truncate">
                  {session.user.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="shrink-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors h-8 w-8 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col bg-[#0f172a] transition-all duration-300">
      <NavContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-[#1E293B] border-slate-700" title="네비게이션 메뉴">
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
