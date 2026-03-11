"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { redirectToLineLogin, getUserInfo, isLoggedIn, logout, UserInfo } from "@/lib/auth.client";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      const timer = setTimeout(() => setLoginError(null), 8000);
      return () => clearTimeout(timer);
    }

    // Auto-open login modal if ?login=true is present
    const loginParam = searchParams.get("login");
    if (loginParam === "true" && !isLoggedIn()) {
      setIsModalOpen(true);
      // Clean up the URL to prevent re-opening on refresh if needed
      // (Optional, but better for UX)
      // window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, user?.id]);

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
    <>
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

      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled || isMobileMenuOpen ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-white shadow-sm' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                <img src="/logo.png" alt="WDIC Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{t("brand_name")}</span>
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center text-gray-900 bg-white/50 border border-gray-200 rounded-xl transition-all active:scale-95"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white overflow-hidden bg-white/30 backdrop-blur-xl"
            >
              <div className="p-6 flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-900/5">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-gray-900">{user.display_name}</span>
                        <span className="text-xs font-bold text-[#D9114A] uppercase tracking-wider">{user.tier} Plan</span>
                      </div>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); handleLogoutClick(); }}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 bg-white shadow-sm rounded-xl border border-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      </button>
                    </div>
                    <Link
                      href="/wdic"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-lg text-center shadow-lg active:scale-[0.98] transition-all"
                    >
                      {t("dashboard")}
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsModalOpen(true); }}
                    className="w-full py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_10px_20px_rgba(217,17,74,0.2)] active:scale-[0.98] transition-all"
                  >
                    {t("login")}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              className="relative bg-white border border-white rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-[440px] p-8 md:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.25)] overflow-hidden"
            >
              {/* Premium Decorative Background Elements */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-50 rounded-full blur-[80px] opacity-70"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-rose-50/20"></div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 md:top-8 right-6 md:right-8 text-gray-400 hover:text-gray-900 transition-all bg-gray-50 hover:bg-gray-100 rounded-full p-2 z-20 hover:rotate-90 active:scale-95"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white/80 backdrop-blur-md border border-white p-3 md:p-5 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex items-center justify-center mb-6 md:mb-10 group">
                  <div className="w-full h-full bg-gradient-to-br from-[#D9114A] to-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-[0_10px_20px_rgba(217,17,74,0.2)] group-hover:rotate-12 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                </div>

                <div className="text-center mb-8 md:mb-12">
                  <h3 className="text-2xl md:text-4xl font-[1000] text-gray-900 mb-3 md:mb-4 tracking-tighter leading-tight">
                    {t("login")}
                  </h3>
                  <div className="h-1.5 w-10 md:w-12 bg-[#D9114A] rounded-full mx-auto mb-4 md:mb-6"></div>
                  <p className="text-gray-500 font-bold text-sm md:text-lg leading-relaxed max-w-[280px] mx-auto opacity-80 whitespace-pre-line">
                    {t("login_desc")}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 w-full">
                  <button
                    onClick={handleLogin}
                    className="group relative w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-[#06C755] text-white font-black text-base md:text-lg shadow-[0_15px_35px_rgba(6,199,85,0.15)] hover:bg-[#05b34c] hover:shadow-[0_20px_45px_rgba(6,199,85,0.25)] hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3 md:gap-4"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                    </div>
                    {t("continue_line")}
                  </button>

                  <button
                    onClick={handleUseGuest}
                    className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-gray-50 text-xs md:text-lg text-gray-400 font-black border border-gray-100 hover:bg-white hover:text-gray-900 hover:border-gray-900/10 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    {t("trial_guest")}
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
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white border border-white rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-[400px] p-8 md:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.25)] text-center overflow-hidden"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-gray-50 rounded-full blur-[80px] opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/30"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-50 text-rose-500 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-10 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[30px] h-[30px] md:w-[40px] md:h-[40px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </div>

                <div className="mb-8 md:mb-12">
                  <h3 className="text-2xl md:text-3xl font-[1000] text-gray-900 mb-3 md:mb-4 tracking-tighter leading-tight">
                    {t("logout_title")}
                  </h3>
                  <p className="text-gray-500 font-bold text-sm md:text-lg leading-relaxed whitespace-pre-line opacity-80">
                    {t("logout_desc")}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 w-full">
                  <button
                    onClick={handleLogoutConfirm}
                    className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-[#D9114A] text-white font-black text-base md:text-lg shadow-[0_15px_35px_rgba(217,17,74,0.15)] hover:bg-rose-600 hover:shadow-[0_20px_45px_rgba(217,17,74,0.25)] hover:-translate-y-1 transition-all active:scale-[0.98]"
                  >
                    {t("logout_confirm")}
                  </button>

                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-gray-50 text-gray-500 font-black text-xs md:text-lg hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-[0.98]"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
