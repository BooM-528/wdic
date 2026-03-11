"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { redirectToLineLogin, getUserInfo, isLoggedIn, logout, UserInfo } from "@/lib/auth.client";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

function HomeContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      const info = getUserInfo();
      if (info?.id !== user?.id) {
        setUser(info);
      }
    }
    const errorParam = searchParams.get("login_error");
    if (errorParam) {
      setLoginError(errorParam);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => setLoginError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Close modal on outside click or Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsModalOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClick);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  function handleLogin() {
    redirectToLineLogin();
  }

  function handleLogoutClick() {
    setIsLogoutModalOpen(true);
  }

  function handleLogoutConfirm() {
    logout();
    window.location.reload();
  }

  function handleUseGuest() {
    setIsModalOpen(false);
    window.location.href = "/wdic";
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20 overflow-hidden">

      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="fixed top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Error Toast */}
      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-8 left-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-white/80 backdrop-blur-2xl border border-red-100 p-4 rounded-3xl shadow-[0_20px_40px_rgba(220,38,38,0.1)] flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-0.5">Login Error</h4>
                <p className="text-xs font-bold text-red-600/80 leading-snug">{loginError === 'state_mismatch' ? 'Security validation failed. Please try again.' : loginError}</p>
              </div>
              <button
                onClick={() => setLoginError(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar Container */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled ? 'py-4 bg-white/70 backdrop-blur-xl border-b border-white shadow-sm' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="WDIC Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">{t("brand_name")}</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-gray-900 leading-none">{user.display_name}</span>
                  <span className="text-[10px] font-bold text-[#D9114A] uppercase tracking-wider">{user.tier} Plan</span>
                </div>
                <Link href="/wdic" className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">
                  {t("dashboard")}
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-800 text-sm font-bold shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.06)] hover:border-gray-300 transition-all text-center flex items-center gap-2"
              >
                {t("login")} <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

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
              {user ? (
                <Link href="/wdic" className="group relative w-full sm:w-auto overflow-hidden px-10 py-5 rounded-2xl bg-gray-900 text-white font-black text-lg shadow-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                  {t("dashboard")}
                </Link>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group relative w-full sm:w-auto overflow-hidden px-12 py-5 rounded-2xl bg-[#D9114A] text-white font-black text-xl shadow-[0_20px_40px_rgba(217,17,74,0.3)] hover:shadow-[0_25px_50px_rgba(217,17,74,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                >
                  {t("start_free")}
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
              )}
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
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-40">
        <div className="relative bg-gray-900 rounded-[4rem] p-12 md:p-24 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
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

            <div className="mt-24">
              {user ? (
                <Link href="/wdic" className="inline-flex px-12 py-5 rounded-2xl bg-white text-gray-900 font-black text-xl shadow-2xl hover:bg-gray-50 hover:scale-105 active:scale-100 transition-all gap-3 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                  {t("dashboard")}
                </Link>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex px-12 py-5 rounded-2xl bg-[#D9114A] text-white font-black text-xl shadow-2xl shadow-rose-900/20 hover:bg-rose-600 hover:scale-105 active:scale-100 transition-all items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  {t("start_free")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 w-full border-t border-gray-200/60 mt-auto bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="WDIC Logo" className="w-full h-full object-contain" />
            </div>
            {t("brand_name")}
          </div>
          <div className="text-sm font-semibold text-gray-400">
            © {new Date().getFullYear()} ArnisongK — Analytics for Serious Poker Players.
          </div>
        </div>
      </footer>
      {/* Login Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
            aria-hidden={!isModalOpen}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              role="dialog"
              aria-modal="true"
              className="relative bg-white border border-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-100 rounded-full blur-3xl opacity-50"></div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2.5 z-10"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-rose-50 text-[#D9114A] rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>

                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">เข้าสู่ระบบ</h3>
                <p className="text-gray-500 font-bold mb-10 text-center leading-relaxed">วิเคราะห์ Hand History<br />ของคุณด้วยพลัง AI</p>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={handleLogin}
                    className="group relative w-full py-4 rounded-2xl bg-[#06C755] text-white font-black text-lg shadow-[0_10px_30px_rgba(6,199,85,0.2)] hover:bg-[#05b34c] hover:shadow-[0_15px_40px_rgba(6,199,85,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                    Continue with LINE
                  </button>

                  <button
                    onClick={handleUseGuest}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-lg hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-[0.98]"
                  >
                    Trial as Guest
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white border border-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl text-center overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gray-100 rounded-full blur-3xl opacity-50"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </div>

                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">ออกจากระบบ?</h3>
                <p className="text-gray-500 font-bold mb-10 leading-relaxed">ยืนยันว่าคุณต้องการ<br />ออกจากระบบในตอนนี้</p>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={handleLogoutConfirm}
                    className="w-full py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_10px_30px_rgba(217,17,74,0.2)] hover:bg-rose-600 hover:shadow-[0_15px_40px_rgba(217,17,74,0.3)] transition-all active:scale-[0.98]"
                  >
                    Yes, Log Out
                  </button>

                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-lg hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}

// --- Sub-components for Layout --- //

function FeatureCard({ icon, title, desc, color, delay }: { icon: React.ReactNode; title: string; desc: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="bg-white/60 backdrop-blur-2xl border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.07)] p-10 rounded-[3rem] transition-all duration-500 hover:-translate-y-3 group text-center"
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA]" />}>
      <HomeContent />
    </Suspense>
  );
}
