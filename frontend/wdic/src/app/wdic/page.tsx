"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { importSession, listSessions } from "@/lib/wdic/api.client";
import { apiFetch } from "@/lib/fetcher.client";
import { getGuestId } from "@/lib/guest.client";
import type { WdicSession } from "@/lib/wdic/types";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getUserInfo, isLoggedIn, logout, UserInfo } from "@/lib/auth.client";

// ✅ Source Options - updated styling for the light theme
const SOURCE_OPTIONS = [
  { value: "n8", label: "Natural8", color: "text-[#D9114A]", bg: "bg-rose-50", border: "border-rose-100" },
  { value: "unknown", label: "Unknown", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-100" },
];

export default function WdicSessionsPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<WdicSession[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Default is "n8" (Natural8)
  const [selectedSource, setSelectedSource] = useState("n8");
  const [user, setUser] = useState<(UserInfo & { usage: any }) | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getUserInfo() as any);
    }
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    window.location.href = "/";
  };

    const refresh = useCallback(async () => {
        try {
            const me = await apiFetch<any>("/accounts/me");
            setUser(me);
        } catch (e) {
            console.error("Failed to fetch user info", e);
        }
        try {
            const data = await listSessions(50);
            setSessions(data);
        } catch (e) {
            console.error("Failed to load sessions", e);
        }
    }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsBusy(true);
    setError(null);

    try {
      const text = await file.text();
      const rawFileText = text.trim();

      if (!rawFileText) {
        throw new Error("File is empty");
      }

      await importSession({
        rawFileText,
        name: file.name,
        source: selectedSource,
      });

      await refresh();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Import failed");
      alert("Import failed: " + (e?.message ?? "Unknown error"));
    } finally {
      setIsBusy(false);
    }
  };

  const currentSourceStyle = SOURCE_OPTIONS.find(s => s.value === selectedSource) || SOURCE_OPTIONS[0];

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20 pb-20 overflow-hidden">

      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="fixed top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-12">

        {/* Navbar / Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-6">
            {/* Removed the 'Back' button here */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D9114A] to-rose-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all transform group-hover:-translate-y-0.5">
                W
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">{t("brand_name")}</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white shadow-sm ring-1 ring-black/5">
                <div className="w-8 h-8 rounded-full bg-rose-100 overflow-hidden flex items-center justify-center border border-white shadow-inner">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-rose-500 font-black text-xs">{user.display_name[0]}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 leading-tight uppercase tracking-tighter">{user.display_name}</span>
                  <span className="text-[8px] font-bold text-[#D9114A] leading-none uppercase tracking-[.2em]">
                    {user.tier}
                  </span>
                </div>
                {isLoggedIn() ? (
                  <button 
                  onClick={handleLogoutClick}
                  className="ml-2 p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
                ) : (
                  <button 
                    onClick={() => {
                        const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
                        const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || '');
                        const state = Math.random().toString(36).substring(7);
                        window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid&bot_prompt=aggressive`;
                    }}
                    className="ml-2 p-1.5 text-rose-500 hover:text-rose-600 transition-colors"
                    title="Login with LINE"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  </button>
                )}
              </div>
            )}
            <LanguageSwitcher />
          </div>
        </motion.div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <h1 className="text-6xl md:text-7xl lg:text-7xl font-[1000] tracking-tighter mb-4 drop-shadow-sm text-gray-900 uppercase leading-[0.9] w-full break-words">
              WHY DID I <span className="bg-gradient-to-br from-[#D9114A] to-rose-400 bg-clip-text text-transparent italic">CALL</span>
            </h1>
            <p className="text-xs font-black text-gray-400 tracking-[0.4em] uppercase flex items-center gap-3">
              <span className="h-[2px] w-8 bg-rose-200"></span>
              {t("hand_history_analytics")}
            </p>
          </motion.div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
          <StatCard
            label={t("stats_total_sessions")}
            value={sessions.length.toString()}
            color="text-gray-900"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>}
            user={user}
          />
          <StatCard
            label={t("stats_analyzed_sessions")}
            value={sessions.reduce((acc: number, s: any) => acc + (s.analyzedSessionCount || 0), 0).toLocaleString()}
            color="bg-gradient-to-r from-[#D9114A] to-rose-400 bg-clip-text text-transparent"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m9 13 2 2 4-4"/></svg>}
            subtext={user?.usage ? `${user.usage.session_count} / ${user.usage.session_limit} ${t("analyzed_today")}${user.usage.extra_session_balance > 0 ? ` (+ ${user.usage.extra_session_balance} ${t("extra")})` : ''}` : undefined}
            progress={user?.usage?.session_count}
            progressMax={user?.usage?.session_limit}
            user={user}
          />
          <StatCard
            label={t("uploaded_hands")}
            value={sessions.reduce((acc: number, s: any) => acc + (s.handCount || 0), 0).toLocaleString()}
            color="text-gray-900"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
            user={user}
          />
          <StatCard
            label={t("stats_analyzed_hands")}
            value={sessions.reduce((acc: number, s: any) => acc + (s.analyzedCount || 0), 0).toLocaleString()}
            color="bg-gradient-to-r from-[#D9114A] to-rose-400 bg-clip-text text-transparent"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1-1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>}
            subtext={user?.usage ? `${user.usage.hand_count} / ${user.usage.hand_limit} ${t("analyzed_today")}${user.usage.extra_hand_balance > 0 ? ` (+ ${user.usage.extra_hand_balance} ${t("extra")})` : ''}` : undefined}
            progress={user?.usage?.hand_count}
            progressMax={user?.usage?.hand_limit}
            user={user}
          />
        </div>

        {/* Session List Header */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
          <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight flex items-center gap-4">
            <span className="w-2.5 h-10 bg-[#D9114A] rounded-full shadow-lg shadow-rose-200"></span>
            {t("analysis_history")}
          </h2>
          <button
            onClick={refresh}
            disabled={isBusy}
            className="text-[10px] font-black text-gray-400 hover:text-rose-500 transition-all uppercase tracking-[.2em] bg-white p-3 px-6 rounded-2xl border border-white shadow-xl shadow-black/5 flex items-center gap-3 active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`${isBusy ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
            {t("refresh")}
          </button>
        </div>

        {/* Session Cards Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col h-full"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:bg-rose-100 transition-colors duration-500"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-white/80 p-1.5 px-3 rounded-full border border-white shadow-sm ring-1 ring-black/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className={`bg-transparent font-black text-[10px] outline-none cursor-pointer uppercase tracking-tight ${currentSourceStyle.color}`}
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                  className={`
                        flex-1 flex flex-col items-center justify-center relative group border-2 border-dashed rounded-[2rem] p-8 transition-all duration-500 text-center cursor-pointer min-h-[160px]
                        ${dragActive ? "border-[#D9114A] bg-rose-50 ring-8 ring-rose-50/50" : "border-gray-200 hover:border-rose-200 hover:bg-white/80"}
                        ${isBusy ? "opacity-50 pointer-events-none" : ""}
                      `}
                >
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    title="Upload .txt File"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    accept=".txt"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${dragActive ? "bg-[#D9114A] text-white rotate-12" : "bg-gray-100 text-gray-400 group-hover:text-rose-500 group-hover:bg-rose-50 group-hover:-rotate-6"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={dragActive ? "animate-bounce" : ""}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    </div>
                    <div className="space-y-1">
                      <span className={`block text-xs font-[900] uppercase tracking-[.15em] ${dragActive ? 'text-[#D9114A]' : 'text-gray-800'}`}>
                        {isBusy ? t("importing") : t("upload_session")}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter block opacity-60">
                        {error ? <span className="text-red-500">{error}</span> : t("drag_drop_hint").replace("{platform}", currentSourceStyle.label)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {sessions.map((session, idx) => (
              <SessionCard key={session.id} session={session} index={idx} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

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

            <h3 className="text-2xl font-black text-gray-900 mb-2">{t("logout") || "Log Out?"}</h3>
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
    </div>
  );
}

// --- Sub-Components ---

function SessionCard({ session, index }: { session: WdicSession; index: number }) {
  const { t } = useLanguage();
  const dateStr = session.started_at
    ? new Date(session.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date(session.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Map source style
  const sourceStyle = SOURCE_OPTIONS.find(s => s.value === session.source) || SOURCE_OPTIONS[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -10 }}
      className="h-full"
    >
      <Link href={`/wdic/sessions/${session.id}`} className="block h-full outline-none group">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/50 hover:shadow-[0_30px_70px_rgba(217,17,74,0.1)] transition-all duration-500 cursor-pointer relative overflow-hidden h-full flex flex-col group/card">

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-12 -mt-12 rounded-full opacity-40 group-hover/card:bg-rose-50 group-hover/card:scale-150 transition-all duration-700 blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 border-[20px] border-gray-50 rounded-full opacity-20 group-hover/card:border-rose-100 transition-colors duration-500"></div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Badge */}
            <div className="mb-8 flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-[1000] uppercase tracking-widest px-4 py-2 rounded-2xl border border-white shadow-sm ring-1 ring-black/5 ${sourceStyle.color} ${sourceStyle.bg}`}>
                  {sourceStyle.label}
                </span>
                {(session.analyzedSessionCount > 0 || session.analyzedCount > 0) && (
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#D9114A] to-rose-400 text-white shadow-md shadow-rose-200" title="AI Analyzed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                      <path d="M20 3v4"/>
                      <path d="M22 5h-4"/>
                      <path d="M4 17v2"/>
                      <path d="M5 18H3"/>
                    </svg>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter bg-gray-50/50 p-1 px-3 rounded-full border border-white">
                #{String(session.id || index).slice(-4)}
              </div>
            </div>

            <h3 className="text-2xl font-[1000] text-gray-900 mb-2 group-hover:text-[#D9114A] transition-colors line-clamp-2 leading-[1.1] tracking-tight">
              {session.name || "Untitled Session"}
            </h3>

            <div className="text-[11px] text-gray-400 font-black mb-10 uppercase tracking-widest flex items-center gap-2 group-hover:text-gray-500 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-200 group-hover:bg-rose-400"></span>
              {dateStr}
            </div>

            <div className="mt-auto pt-8 border-t border-gray-50 flex justify-between items-end">
              <div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em] mb-2">{t("hands_played")}</div>
                <div className="text-5xl font-[1000] text-gray-900 tracking-tighter leading-none">
                  {session.handCount ?? 0}
                </div>
              </div>

              <div className="w-14 h-14 flex items-center justify-center bg-gray-100 text-gray-400 group-hover:bg-[#D9114A] group-hover:text-white rounded-2xl transition-all duration-500 shadow-sm group-hover:shadow-[0_15px_30px_rgba(217,17,74,0.3)] group-hover:rotate-12 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatCard({ label, value, color, icon, subtext, user, progress, progressMax }: { label: string; value: string; color: string; icon: React.ReactNode; subtext?: string; user: any; progress?: number; progressMax?: number }) {
  const { t } = useLanguage();
  const percent = progress !== undefined && progressMax !== undefined ? Math.min(100, (progress / Math.max(1, progressMax)) * 100) : 0;
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-[0_15px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 text-gray-50 group-hover:text-rose-50/50 transition-colors duration-500 transform group-hover:scale-150 group-hover:-rotate-12">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { width: 80, height: 80, strokeWidth: 1 }) : null}
      </div>

      <div className="relative z-10">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all duration-500 shadow-inner">
          {icon}
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[.25em] mb-2">
          {label}
        </div>
        <div className={`text-4xl md:text-5xl font-[1000] tracking-tighter ${color} drop-shadow-sm leading-none`}>{value}</div>
        {subtext && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-widest">
              <span>{t("daily_progress")}</span>
              <span className="text-[#D9114A]">{Math.round(percent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${percent}%` }}
                 className="h-full bg-gradient-to-r from-[#D9114A] to-rose-400"
               />
            </div>
            <div className="text-[8px] font-medium text-gray-400">
              {subtext}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}