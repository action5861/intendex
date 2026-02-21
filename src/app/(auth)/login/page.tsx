"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "회원가입에 실패했습니다");
          setLoading(false);
          return;
        }

        // Auto login after register
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("로그인에 실패했습니다");
          setLoading(false);
          return;
        }

        router.push("/onboarding");
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다");
          setLoading(false);
          return;
        }

        router.push("/dashboard");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#fafafa] overflow-hidden p-4 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-blue-100/60 rounded-full mix-blend-multiply blur-[100px] animate-blob" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-indigo-100/60 rounded-full mix-blend-multiply blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <Card className="border-0 shadow-[0_20px_40px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <CardHeader className="text-center pt-10 pb-6 px-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-blue-500/30 ring-4 ring-white"
            >
              IX
            </motion.div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Intendex</CardTitle>
            <CardDescription className="text-base font-medium text-slate-500">
              {isRegister
                ? "의도를 가치로 만드는 첫 걸음"
                : "데이터 기본소득 대시보드 로그인"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: "1rem" }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden space-y-2"
                  >
                    <label className="text-sm font-bold text-slate-700 ml-1">이름</label>
                    <Input
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isRegister}
                      className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all px-4 font-medium"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">이메일 계정</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all px-4 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">비밀번호</label>
                <Input
                  type="password"
                  placeholder="6자리 이상 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all px-4 font-medium"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-semibold text-rose-500 text-center bg-rose-50 py-2.5 rounded-lg border border-rose-100"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-14 mt-6 text-[15px] font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isRegister ? "회원가입 완료" : "로그인"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
              >
                {isRegister
                  ? "이미 계정이 있으신가요? 로그인하기"
                  : "아직 계정이 없으신가요? 3초만에 가입하기"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
