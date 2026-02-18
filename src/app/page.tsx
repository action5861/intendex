"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Coins, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  CheckCircle2,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Components ---

const FeatureCard = ({ icon: Icon, step, title, description }: any) => (
  <motion.div 
    whileHover={{ y: -10, scale: 1.05 }}
    className="relative flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50"
  >
    <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg">
      {step}
    </div>
    <div className="mb-6 p-4 w-fit rounded-2xl bg-blue-50 text-blue-600">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed break-keep">{description}</p>
  </motion.div>
);

// --- Main Page ---

export default function LandingPage() {
  const [accumulatedAmount, setAccumulatedAmount] = useState(2847230);

  // 실시간 카운터 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setAccumulatedAmount(prev => prev + Math.floor(Math.random() * 150));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      
      {/* 📱 모바일 상단 고정 카운터 */}
      <div className="md:hidden sticky top-0 z-50 bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium shadow-md">
        오늘 전체 지급액: <span className="animate-pulse">₩{accumulatedAmount.toLocaleString()}</span>
      </div>

      {/* Header */}
      <header className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-blue-200 shadow-lg">
            IX
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">Intendex</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">작동 원리</a>
          <a href="#trust" className="hover:text-blue-600 transition-colors">보안</a>
          <Link href="/login">
            <Button variant="outline" className="rounded-full px-6">로그인</Button>
          </Link>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative container mx-auto px-6 py-12 md:py-24 lg:py-32 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight break-keep">
                당신의 의도가 <br className="hidden md:block" />
                <span className="text-blue-600">평생 자산</span>이 되는 곳
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-600 font-medium break-keep">
                하루 60초, 데이터 기본소득이 시작됩니다. <br className="hidden md:block" />
                AI와 간단한 대화만으로 수익을 만듭니다.
              </p>
            </motion.div>

            {/* 실시간 카운터 (데스크탑) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="hidden md:flex items-center gap-3 mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl w-fit"
            >
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 font-medium">오늘 전체 지급액:</span>
              <span className="text-xl font-bold text-emerald-600">₩{accumulatedAmount.toLocaleString()}</span>
            </motion.div>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* ✅ [수정] 메인 버튼 로그인 링크 연결 */}
              <Link href="/login">
                <Button size="lg" className="h-16 px-10 text-lg font-bold rounded-full bg-linear-to-r from-blue-600 to-blue-500 hover:shadow-blue-200 hover:shadow-2xl transition-all gap-2 animate-bounce-subtle cursor-pointer">
                  지금 내 데이터 자산 만들기 <ArrowRight />
                </Button>
              </Link>
              <a href="#how-it-works" className="text-slate-500 font-medium hover:underline decoration-2 underline-offset-4">
                어떻게 가능한가요?
              </a>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="flex-1 relative w-full max-w-125">
            <div className="relative w-full aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
              <div className="absolute inset-0 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
              
              <div className="relative grid grid-cols-2 gap-4">
                {[MessageSquare, Cpu, Coins, TrendingUp].map((Icon, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 4, delay: i * 0.5 }}
                    className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-blue-600 border border-slate-50"
                  >
                    <Icon size={40} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⚙️ How It Works */}
      <section id="how-it-works" className="bg-slate-50 py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 break-keep">
              어떻게 내 데이터 기본소득이 만들어지나요?
            </h2>
            <div className="h-1.5 w-20 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              step="1"
              icon={MessageSquare}
              title="60초 짧은 대화"
              description="오늘의 계획, 관심사를 AI에게 편안하게 말해주세요. 자연스러운 대화가 데이터화됩니다."
            />
            <FeatureCard 
              step="2"
              icon={Lock}
              title="생각을 데이터 자산으로"
              description="익명화된 '의도(Intent)'만 추출하여 당신 소유의 안전한 디지털 인덱스 자산으로 변환합니다."
            />
            <FeatureCard 
              step="3"
              icon={Coins}
              title="매일 쌓이는 데이터 기본소득"
              description="데이터 인덱스가 활용될 때마다 정당한 가치만큼 지속적인 수익이 창출됩니다."
            />
          </div>
        </div>
      </section>

      {/* 🔐 Trust & Identity */}
      <section id="trust" className="bg-[#1a1a2e] text-white py-24 px-6 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black leading-tight break-keep">
                당신의 개인정보는 <br />
                <span className="text-blue-400">단 한 글자도 넘기지 않습니다</span>
              </h2>
              <p className="text-slate-400 text-lg mt-2 break-keep">
                오직 익명화된 '의도'만 안전하게 거래됩니다.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">개인정보 완전 차단</h4>
                    <p className="text-slate-400 text-sm">이름, 연락처, 위치 등 신원 정보는 수집하지도, 저장하지도, 전달하지도 않습니다. 광고주에게 전달되는 것은 오직 익명 의도 데이터뿐입니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">내 데이터, 내가 주인</h4>
                    <p className="text-slate-400 text-sm">데이터 삭제 요청 시 즉시 완전 삭제됩니다. 동의 없이는 어떤 데이터도 활용되지 않습니다. 데이터의 모든 권한은 당신에게 있습니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">100% 투명한 보상</h4>
                    <p className="text-slate-400 text-sm">내 의도 데이터가 언제, 어디서, 얼마나 활용되었는지 실시간으로 확인할 수 있습니다. 숨기는 것 없이, 정당한 가치를 돌려드립니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white/5 p-10 rounded-[40px] border border-white/10 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-6 text-blue-400">Intendex = Intent + Index</h3>
              <p className="text-lg leading-relaxed text-slate-300 break-keep">
                개인정보가 아닌, 오직 <span className="text-white font-bold">'의도(Intent)'</span>만 <br />
                안전하게 인덱싱하여 거래합니다. <br />
                당신이 누구인지는 모르지만, 무엇을 원하는지만 압니다. <br />
                <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">이것이 우리가 만드는 공정한 디지털 경제입니다.</span>
              </p>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                <ShieldCheck size={40} className="text-blue-400" />
                <span className="text-sm text-slate-400 font-medium">개인정보보호법 및 데이터 3법을 철저히 준수합니다.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="container mx-auto max-w-4xl bg-linear-to-b from-blue-50 to-white p-12 md:p-20 rounded-[60px] border border-blue-100 shadow-2xl shadow-blue-100">
          <h2 className="text-3xl md:text-4xl font-black mb-6 break-keep">
            이미 수천 명이 자신의 'Intent'로 <br />
            데이터 기본소득을 얻고 있습니다.
          </h2>
          <p className="text-xl text-slate-600 mb-10">지금, 당신의 데이터 기본소득 권리를 찾으세요.</p>
          
          {/* ✅ [수정] 하단 큰 버튼 로그인 링크 연결 */}
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="h-20 px-12 text-xl font-black rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 animate-pulse-slow cursor-pointer">
                60초로 첫 데이터 기본소득 만들기
              </Button>
            </motion.div>
          </Link>
          
          <p className="mt-8 text-slate-400 text-sm font-medium">
            가입비 무료 | 언제든 중단 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 opacity-50 grayscale">
             <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white font-bold text-[10px]">IX</div>
             <span className="font-bold">Intendex</span>
          </div>
          <p className="text-slate-400 text-xs">
            © 2026 인텐덱스. 모든 데이터 보상은 예시이며 실제 수익은 변동될 수 있습니다. <br />
            <span className="underline cursor-pointer">개인정보처리방침</span> | <span className="underline cursor-pointer">이용약관</span>
          </p>
        </div>
      </footer>

      {/* 📱 [수정] 모바일 하단 Sticky CTA 로그인 링크 연결 */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <Link href="/login">
          <Button className="w-full h-14 rounded-full bg-blue-600 text-lg font-bold shadow-2xl cursor-pointer">
            지금 바로 시작하기
          </Button>
        </Link>
      </div>

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
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}