"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import Link from 'next/link';
import { isLoggedIn } from "@/lib/auth.client";
import { useEffect, useState } from "react";

function FeatureCard({ icon, title, desc, color, delay }: { icon: React.ReactNode; title: string; desc: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="bg-white/60 backdrop-blur-2xl border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.07)] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] transition-all duration-500 hover:-translate-y-3 group text-center"
    >
      <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-sm mb-8 group-hover:bg-[#D9114A] group-hover:border-[#D9114A] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
        {num}
      </div>
      <h4 className="text-xl font-black text-white mb-4">{title}</h4>
      <p className="text-gray-400 font-medium text-lg px-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function HomeContent() {
  const { t } = useLanguage();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isLoggedIn());
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* Left Column: Value Proposition */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-rose-100 text-[#D9114A] text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              {t("hero_badge")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.6] mb-8 overflow-visible"
            >
              {t("hero_title_part1")}<br />
              {t("hero_title_part2Base")}<br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#D9114A] via-rose-500 to-rose-400">
                  {t("hero_title_pro")}
                </span>
                <div className="absolute -bottom-2 left-0 w-full h-2 bg-[#D9114A]/10 rounded-full blur-md"></div>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 font-medium max-w-xl mb-12 leading-relaxed"
            >
              {t("hero_subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
            >
                <Link 
                  href={isAuth ? "/wdic" : "/?login=true"} 
                  className="group relative w-full sm:w-auto overflow-hidden px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl bg-[#D9114A] text-white font-black text-lg md:text-xl shadow-[0_20px_40px_rgba(217,17,74,0.3)] hover:shadow-[0_25px_50px_rgba(217,17,74,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                >
                  {isAuth ? t("dashboard") : t("start_free")}
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </Link>
            </motion.div>
          </div>

          {/* Right Column: Visual Stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            {/* Visual Stage Container */}
            <div className="relative w-full aspect-square max-w-[540px] flex items-center justify-center">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D9114A]/10 via-rose-500/5 to-indigo-500/10 rounded-[4rem] blur-3xl opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03] bg-[radial-gradient(#D9114A_1.5px,transparent_1.5px)] [background-size:40px_40px]"></div>

              <motion.div
                animate={{
                  y: [0, -25, 0],
                  rotate: [0, 1, 0, -1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10 w-full h-full flex items-center justify-center"
              >
                {/* Logo with sophisticated shadow */}
                <img
                  src="/logo.png"
                  alt="WDIC Premium Logo"
                  className="w-[85%] h-[85%] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.12)] drop-shadow-[0_60px_100px_rgba(217,17,74,0.15)]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">{t("features_title")}</h2>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">{t("features_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            }
            title={t("feature1_title")}
            desc={t("feature1_desc")}
            color="from-rose-50 to-rose-100/30 text-rose-500"
            delay={0.1}
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
            }
            title={t("feature2_title")}
            desc={t("feature2_desc")}
            color="from-blue-50 to-blue-100/30 text-blue-500"
            delay={0.2}
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            }
            title={t("feature3_title")}
            desc={t("feature3_desc")}
            color="from-indigo-50 to-indigo-100/30 text-indigo-500"
            delay={0.3}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 md:py-40">
        <div className="relative bg-gray-900 rounded-[3rem] md:rounded-[4rem] p-8 md:p-24 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/10 to-transparent"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#D9114A]/10 rounded-full blur-[80px]"></div>

          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-20 tracking-tight">{t("how_it_works")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              <StepItem num="1" title={t("step1_title")} desc={t("step1_desc")} />
              <StepItem num="2" title={t("step2_title")} desc={t("step2_desc")} />
              <StepItem num="3" title={t("step3_title")} desc={t("step3_desc")} />
            </div>

            <div className="mt-16 md:mt-24">
                <Link 
                  href={isAuth ? "/wdic" : "/?login=true"} 
                  className="inline-flex px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl bg-[#D9114A] text-white font-black text-lg md:text-xl shadow-2xl shadow-rose-900/20 hover:bg-rose-600 hover:scale-105 active:scale-100 transition-all items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  {isAuth ? t("dashboard") : t("start_free")}
                </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
      <HomeContent />
  );
}
