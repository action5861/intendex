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
  Cpu,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Components ---

const FeatureCard = ({ icon: Icon, step, title, description }: { icon: React.ElementType, step: string, title: string, description: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="relative flex flex-col p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-300"
  >
    <div className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-blue-500/30 ring-4 ring-white">
      {step}
    </div>
    <div className="mb-6 p-4 w-fit rounded-2xl bg-blue-50 text-blue-600">
      <Icon size={28} strokeWidth={2} />
    </div>
    <h3 className="text-xl font-extrabold mb-3 text-slate-900 tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium break-keep">{description}</p>
  </motion.div>
);

// --- Main Page ---

export default function LandingPage() {
  const [accumulatedAmount, setAccumulatedAmount] = useState(2847230);
  const [isScrolled, setIsScrolled] = useState(false);

  // 실시간 카운터 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setAccumulatedAmount(prev => prev + Math.floor(Math.random() * 150));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden selection:bg-blue-200 selection:text-blue-900 font-sans">

      {/* 📱 모바일 상단 고정 카운터 */}
      <div className="md:hidden sticky top-0 z-50 bg-slate-900 text-white py-2.5 px-4 text-center text-sm font-semibold shadow-md flex justify-center items-center gap-2">
        <Sparkles size={16} className="text-amber-400" />
        오늘 전체 지급액: <span className="text-amber-400 animate-pulse">₩{accumulatedAmount.toLocaleString()}</span>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-4 hidden md:block" : "bg-transparent py-6 hidden md:block"}`}>
        <div className="container mx-auto flex items-center justify-between px-6 xl:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white font-black text-lg shadow-lg shadow-blue-500/30">
              IX
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Intendex</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">작동 원리</a>
            <a href="#trust" className="hover:text-blue-600 transition-colors">보안</a>
            <Link href="/login">
              <Button variant="outline" className="rounded-full px-6 py-5 font-semibold border-slate-200 hover:bg-slate-50 transition-all">로그인</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full px-6 py-5 font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20">시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative pt-20 md:pt-40 pb-20 md:pb-32 overflow-hidden px-6">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100/60 rounded-full mix-blend-multiply blur-[100px] animate-blob" />
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-indigo-100/60 rounded-full mix-blend-multiply blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-emerald-50/60 rounded-full mix-blend-multiply blur-[100px] animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-semibold mb-8 text-sm shadow-sm md:mx-0 mx-auto">
                  <Sparkles size={16} />
                  <span>새로운 데이터 패러다임의 시작</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight break-keep text-slate-900">
                  당신의 의도가 <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">평생 자산</span>이 되는 곳
                </h1>

                <p className="mt-6 text-lg md:text-xl text-slate-500 font-medium break-keep max-w-2xl mx-auto lg:mx-0">
                  하루 60초, AI와 간단한 대화만으로 당신만의 데이터 기본소득을 얻으세요. 당신의 일상이 가치로 환산됩니다.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-bold rounded-full bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 shadow-xl shadow-slate-900/20">
                      지금 데이터 기본소득 만들기 <ArrowRight size={20} />
                    </Button>
                  </Link>
                  <a href="#how-it-works" className="text-slate-500 font-semibold hover:text-slate-900 transition-colors px-6 py-4 flex items-center justify-center">
                    어떻게 가능한가요?
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right: Visual */}
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-square flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full border border-white backdrop-blur-3xl" />

                {/* Floating Elements */}
                <div className="relative w-full h-full">
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 p-5 bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col items-center gap-2 z-20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">의도 수집</span>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 p-5 bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col items-center gap-2 z-20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Cpu size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">AI 분석</span>
                  </motion.div>

                  <motion.div
                    animate={{ scale: [1, 1.05, 1], y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white z-30 w-64 text-center"
                  >
                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                      <TrendingUp size={40} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">실시간 누적 보상</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₩{accumulatedAmount.toLocaleString()}</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0], rotate: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 p-5 bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col items-center gap-2 z-20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Coins size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">가치 창출</span>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 p-5 bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col items-center gap-2 z-20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">익명 보호</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ⚙️ How It Works */}
      <section id="how-it-works" className="relative py-32 px-6 bg-white overflow-hidden">
        {/* subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 break-keep tracking-tight text-slate-900">
              어떻게 데이터 기본소득이 만들어지나요?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">단 3단계만으로 당신의 일상이 매일 쌓이는 자산으로 변합니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 pl-4 md:pl-0">
            <FeatureCard
              step="1"
              icon={MessageSquare}
              title="60초 짧은 대화"
              description="오늘의 계획, 관심사를 AI에게 편안하게 말해주세요. 자연스러운 대화가 가치 있는 데이터로 구체화됩니다."
            />
            <div className="hidden md:flex absolute top-1/2 left-[30%] -translate-y-1/2 text-slate-300">
              <ArrowRight size={32} />
            </div>
            <FeatureCard
              step="2"
              icon={Lock}
              title="의도를 데이터 자산으로"
              description="완벽히 익명화된 '의도(Intent)'만을 추출하여, 오직 당신만이 소유할 수 있는 안전한 디지털 인덱스 자산으로 변환합니다."
            />
            <div className="hidden md:flex absolute top-1/2 right-[30%] -translate-y-1/2 text-slate-300">
              <ArrowRight size={32} />
            </div>
            <FeatureCard
              step="3"
              icon={Coins}
              title="매일 쌓이는 보상"
              description="당신의 데이터 인덱스가 실질적으로 활용될 때마다, 그 가치에 부합하는 정당하고 지속적인 수익이 창출됩니다."
            />
          </div>
        </div>
      </section>

      {/* 🔐 Trust & Identity */}
      <section id="trust" className="bg-[#0a0f1c] text-white py-32 px-6 relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 font-semibold text-sm">
                <ShieldCheck size={16} />
                <span>강력한 개인정보 보호</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight break-keep">
                당신의 개인정보는 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">단 한 글자도 공유되지 않습니다</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium break-keep leading-relaxed">
                우리는 당신이 누구인지 묻지 않습니다. 오직 &apos;무엇을 원하는지&apos;에 대한 익명화된 의도만 안전하게 거래됩니다.
              </p>

              <div className="space-y-8 pt-4">
                <div className="flex gap-5">
                  <div className="mt-1 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2 text-slate-100">개인정보 완전 차단</h4>
                    <p className="text-slate-400 leading-relaxed font-medium">이름, 연락처, 위치 등 신원 정보는 수집하지도, 저장하지도 않습니다. 광고주에게 전달되는 것은 오직 완벽히 분리된 의도 데이터뿐입니다.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="mt-1 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <CheckCircle2 className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2 text-slate-100">내 데이터, 내가 주인</h4>
                    <p className="text-slate-400 leading-relaxed font-medium">데이터 삭제 요청 시 즉시 흔적 없이 완전 삭제됩니다. 당신의 동의 없이는 어떤 데이터도 활용되지 않습니다.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="mt-1 w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <CheckCircle2 className="text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2 text-slate-100">100% 투명한 보상 설계</h4>
                    <p className="text-slate-400 leading-relaxed font-medium">내 의도 데이터가 언제, 어디서, 얼마나 활용되었는지 대시보드에서 실시간으로 직접 확인하고 정산받을 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl lg:max-w-none">
              <div className="bg-slate-900/50 p-10 md:p-12 rounded-[2.5rem] border border-slate-700/50 backdrop-blur-xl relative shadow-2xl overflow-hidden group hover:border-blue-500/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-colors duration-500" />

                <h3 className="text-3xl font-extrabold mb-8 text-white tracking-tight flex items-center gap-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Intendex</span>
                  <span className="text-slate-500 font-light">=</span>
                  Intent <span className="text-slate-500 font-light">+</span> Index
                </h3>
                <p className="text-xl leading-[1.8] text-slate-300 font-medium break-keep z-10 relative">
                  개인정보가 아닌, 오직 <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md">&apos;의도(Intent)&apos;</span>만을 <br />
                  안전하게 인덱싱하여 다룹니다. <br /><br />
                  당신이 누구인지는 모르지만, 무엇을 원하는지만 압니다. <br />
                  <span className="text-blue-400 font-bold border-b-2 border-blue-500/30 pb-1 mt-4 inline-block">이것이 우리가 완성하는 공정한 데이터 경제입니다.</span>
                </p>

                <div className="mt-12 pt-8 border-t border-slate-700/50 flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-600">
                    <ShieldCheck size={32} className="text-slate-300" />
                  </div>
                  <span className="text-sm md:text-base text-slate-400 font-medium leading-relaxed">
                    Intendex는 개인정보보호법 및 데이터 3법 등 <br className="hidden md:block" />모든 규제를 가장 엄격한 기준으로 준수합니다.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 Final CTA */}
      <section className="py-32 px-6 text-center bg-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 shadow-2xl relative overflow-hidden">
            {/* Dark background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_50%)]" />

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 break-keep tracking-tight text-white leading-tight">
              당신의 "Intent"로 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">데이터 기본소득</span>을 시작하세요.
            </h2>

            <Link href="/login" className="inline-block mt-8">
              <Button size="lg" className="h-20 px-12 md:px-16 text-xl md:text-2xl font-black rounded-full bg-white text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] gap-3 cursor-pointer">
                지금 바로 시작하기 <ArrowRight className="text-blue-600" size={28} />
              </Button>
            </Link>

            <p className="mt-10 text-slate-400 text-sm font-medium relative z-10">
              가입 및 최초 60초 대화에 소요되는 시간입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-16 bg-[#fafafa]">
        <div className="container mx-auto px-6 text-center md:flex md:justify-between md:text-left items-center">
          <div className="flex flex-col items-center md:items-start gap-4 mb-8 md:mb-0">
            <div className="flex items-center gap-3 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-black text-xs">IX</div>
              <span className="font-extrabold text-slate-900 text-xl tracking-tight">Intendex</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">당신의 의도가 가치가 되는 새로운 시대</p>
          </div>

          <div className="text-slate-400 text-sm font-medium space-y-2">
            <p>© 2026 Intendex. All rights reserved.</p>
            <div className="flex items-center justify-center md:justify-end gap-4 mt-2">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">개인정보처리방침</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">이용약관</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">고객지원</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 📱 모바일 하단 Sticky CTA */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <Link href="/login">
          <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white text-lg font-bold shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all cursor-pointer">
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}