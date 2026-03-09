"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { importSession, listSessions } from "@/lib/wdic/api.client";
import { getGuestId } from "@/lib/guest.client";
import type { WdicSession } from "@/lib/wdic/types";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

  const refresh = useCallback(async () => {
    try {
      getGuestId(); 
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
    <div className="relative min-h-screen bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20 pb-20">
      
      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden pb-10 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-12">
        
        {/* Navbar / Top Bar */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <Link href="/" className="inline-flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:border-gray-400 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{t("back")}</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="w-8 h-8 bg-gradient-to-br from-[#D9114A] to-rose-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">W</div>
                <LanguageSwitcher />
            </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-sm text-gray-900 uppercase">
                WHY DID I <span className="bg-gradient-to-br from-[#D9114A] to-rose-400 bg-clip-text text-transparent italic">CALL?</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 tracking-[0.3em] uppercase">
                {t("hand_history_analytics")}
            </p>
          </div>
          
          {/* Upload Area (Glassmorphism) */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            
            {/* Dropdown Platform */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex items-center justify-between transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3">{t("platform")}:</span>
                <select 
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className={`
                        bg-transparent font-black text-sm outline-none cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white transition-colors
                        ${currentSourceStyle.color}
                    `}
                >
                    {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Drag & Drop Zone */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className={`
                  relative group border-2 border-dashed rounded-[2rem] p-8 transition-all duration-300 text-center cursor-pointer overflow-hidden
                  ${dragActive ? "border-[#D9114A] bg-rose-50/80 scale-105" : "border-gray-300/50 bg-white/60 backdrop-blur-xl hover:border-rose-300 hover:bg-white shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}
                  ${isBusy ? "opacity-50 pointer-events-none animate-pulse" : ""}
                `}
            >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  title="Upload .txt File"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".txt"
                />
                <div className="flex flex-col items-center gap-3 relative z-0">
                  <div className={`p-4 rounded-2xl transition-colors duration-300 ${dragActive ? "bg-[#D9114A] text-white shadow-lg" : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 group-hover:text-[#D9114A] group-hover:bg-rose-50"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${dragActive ? 'animate-bounce' : ''}`}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  </div>
                  <div className="space-y-1">
                      <span className={`block text-xs font-black uppercase tracking-widest transition-colors ${dragActive ? 'text-[#D9114A]' : 'text-gray-800'}`}>
                          {isBusy ? t("importing") : t("upload_session")}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {error ? <span className="text-red-500">{error}</span> : t("drag_drop_hint").replace("{platform}", currentSourceStyle.label)}
                      </span>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          <StatCard label={t("stats_total_sessions")} value={sessions.length.toString()} color="text-gray-900" />
          <StatCard label={t("stats_analyzed_hands")} value={sessions.reduce((acc: number, s: any) => acc + (s.handCount || 0), 0).toLocaleString()} color="bg-gradient-to-r from-[#D9114A] to-rose-400 bg-clip-text text-transparent" />
          <StatCard label={t("stats_active_platform")} value={currentSourceStyle.label} color="text-gray-400" />
        </div>

        {/* Session List Header */}
        <div className="flex justify-between items-center mb-8 pb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-[#D9114A] rounded-full inline-block"></span>
              {t("analysis_history")}
            </h2>
            <button 
              onClick={refresh} 
              disabled={isBusy} 
              className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.06)] disabled:opacity-50 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isBusy ? "animate-spin" : ""}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                {t("refresh")}
            </button>
        </div>
        
        {/* Session Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          ) : (
            <div className="col-span-full py-28 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner text-gray-300">
                🫙
              </div>
              <div className="text-gray-900 font-black tracking-tight text-2xl mb-2">{t("no_history_title")}</div>
              <div className="text-gray-500 font-medium max-w-sm">{t("no_history_desc")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function SessionCard({ session }: { session: WdicSession }) {
  const { t } = useLanguage();
  const dateStr = session.started_at 
    ? new Date(session.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})
    : new Date(session.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Map source style
  const sourceStyle = SOURCE_OPTIONS.find(s => s.value === session.source) || SOURCE_OPTIONS[1];

  return (
    <Link href={`/wdic/sessions/${session.id}`} className="block h-full outline-none">
      <div className="group bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden h-full flex flex-col focus-visible:ring-4 ring-gray-200">
        
        {/* Decorative Floating Icon Background */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-gray-50 to-white rounded-full flex items-center justify-center opacity-40 group-hover:scale-110 group-hover:-rotate-12 group-hover:from-rose-50 group-hover:to-rose-100/50 transition-all duration-500 shadow-inner z-0 pointer-events-none">
           <span className="font-black text-6xl text-gray-200 group-hover:text-rose-200 uppercase transform rotate-12">
             {session.source === 'n8' ? 'N8' : 'GG'}
           </span>
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Badge */}
          <div className="mb-6 flex justify-between items-start">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/50 ${sourceStyle.color} ${sourceStyle.bg} shadow-sm`}>
              {sourceStyle.label}
            </span>
          </div>
          
          <h3 className="text-xl font-black text-gray-800 mb-2 group-hover:text-[#D9114A] transition-colors line-clamp-2 leading-tight">
            {session.name || "Untitled Session"}
          </h3>
          
          <div className="text-[11px] text-gray-400 font-bold mb-8 uppercase tracking-widest flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {dateStr}
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-end">
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">{t("hands_played")}</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter">
                {session.handCount ?? 0}
              </div>
            </div>
            
            <div className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-[#D9114A] group-hover:text-white rounded-2xl transition-all duration-300 shadow group-hover:shadow-[0_8px_20px_rgba(217,17,74,0.3)] group-hover:scale-110 group-hover:-rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {label}
      </div>
      <div className={`text-3xl md:text-5xl font-black tracking-tighter ${color} drop-shadow-sm`}>{value}</div>
    </div>
  );
}