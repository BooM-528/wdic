"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { redirectToLineLogin, getUserInfo, isLoggedIn, logout, UserInfo } from "@/lib/auth.client";
import { Suspense } from "react";

function HomeContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getUserInfo());
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
    <main className="relative min-h-screen bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20 pb-20 overflow-hidden">

      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="fixed top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Error Toast */}
      {loginError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span className="text-sm font-bold">Login failed: {loginError === 'state_mismatch' ? 'Security validation failed' : loginError}</span>
            <button onClick={() => setLoginError(null)} className="text-red-400 hover:text-red-600 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Navbar Container */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D9114A] to-rose-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              W
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">{t("brand_name")}</span>
          </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-32 text-center flex flex-col items-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-rose-100 text-[#D9114A] text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
          {t("hero_badge")}
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 max-w-4xl drop-shadow-sm">
          {t("hero_title_part1")}<br /> {t("hero_title_part2Base")}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9114A] to-rose-400">{t("hero_title_pro")}</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mb-12 leading-relaxed">
          {t("hero_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {user ? (
            <Link href="/wdic" className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_8px_25px_rgba(217,17,74,0.3)] hover:shadow-[0_12px_35px_rgba(217,17,74,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              {t("dashboard")}
            </Link>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_8px_25px_rgba(217,17,74,0.3)] hover:shadow-[0_12px_35px_rgba(217,17,74,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              {t("start_free")}
            </button>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-gray-200/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{t("features_title")}</h2>
          <p className="text-gray-500 font-medium">{t("features_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📥"
            title={t("feature1_title")}
            desc={t("feature1_desc")}
            color="from-blue-50 to-blue-100/50"
          />
          <FeatureCard
            icon="📊"
            title={t("feature2_title")}
            desc={t("feature2_desc")}
            color="from-rose-50 to-rose-100/50"
          />
          <FeatureCard
            icon="🔍"
            title={t("feature3_title")}
            desc={t("feature3_desc")}
            color="from-indigo-50 to-indigo-100/50"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.05)] text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-12">{t("how_it_works")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-[20%] left-1/6 right-1/6 h-0.5 bg-gray-200/50 z-0"></div>

            <StepItem num="1" title={t("step1_title")} desc={t("step1_desc")} />
            <StepItem num="2" title={t("step2_title")} desc={t("step2_desc")} />
            <StepItem num="3" title={t("step3_title")} desc={t("step3_desc")} />
          </div>

          <div className="mt-16">
            {user ? (
              <Link href="/wdic" className="inline-flex px-10 py-4 rounded-2xl bg-gray-900 text-white font-black text-lg shadow-xl hover:bg-gray-800 hover:scale-105 transition-all gap-3 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                {t("dashboard")}
              </Link>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex px-10 py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_8px_25px_rgba(217,17,74,0.3)] hover:shadow-[0_12px_35px_rgba(217,17,74,0.4)] hover:scale-105 hover:-translate-y-1 active:translate-y-0 transition-all items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {t("start_free")}
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="relative z-10 w-full border-t border-gray-200/60 mt-auto bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="w-6 h-6 bg-[#D9114A] rounded text-white flex items-center justify-center text-xs">W</div>
            {t("brand_name")}
          </div>
          <div className="text-sm font-semibold text-gray-400">
            © {new Date().getFullYear()} ArnisongK — Analytics for Serious Poker Players.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 transition-opacity duration-300"
          aria-hidden={!isModalOpen}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            className="relative bg-white/95 backdrop-blur-2xl border border-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl transform transition-all duration-300 animate-in zoom-in-95"
          >
            {/* Close icon */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="w-16 h-16 bg-[#D9114A]/10 text-[#D9114A] rounded-2xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">เข้าสู่แดชบอร์ด</h3>
            <p className="text-gray-500 font-medium mb-8">วิเคราะห์ Hand History ส่วนตัวของคุณ</p>

            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={handleLogin}
                className="w-full py-3.5 rounded-xl bg-[#06C755] text-white font-bold hover:bg-[#05b34c] transition-all shadow-lg hover:shadow-[#06C755]/30 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                Continue with LINE
              </button>

              <button
                onClick={handleUseGuest}
                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Trial as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 transition-opacity duration-300"
        >
          <div
            className="relative bg-white/95 backdrop-blur-2xl border border-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl transform transition-all duration-300 animate-in zoom-in-95 text-center"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">Log Out?</h3>
            <p className="text-gray-500 font-medium mb-8">Are you sure you want to log out?</p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleLogoutConfirm}
                className="w-full py-3.5 rounded-xl bg-[#D9114A] text-white font-bold hover:bg-rose-600 transition-all shadow-lg active:scale-[0.98]"
              >
                Yes, Log Out
              </button>

              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// --- Sub-components for Layout --- //

function FeatureCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-6 md:p-8 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 group">
      <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center relative z-10 group">
      <div className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-xl font-black text-gray-900 shadow-sm mb-6 group-hover:border-[#D9114A] group-hover:text-[#D9114A] group-hover:scale-110 transition-all duration-300">
        {num}
      </div>
      <h4 className="text-lg font-black text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-500 font-medium text-sm px-4">{desc}</p>
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
