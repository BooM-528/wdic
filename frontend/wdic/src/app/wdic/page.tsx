"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { importSession, listSessions } from "@/lib/wdic/api.client";
import { getGuestId } from "@/lib/guest.client";
import type { WdicSession } from "@/lib/wdic/types";

// ✅ กำหนด value ให้ตรงกับ Model Django: "n8", "gg", "pokerstars"
const SOURCE_OPTIONS = [
  { value: "n8", label: "Natural8", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  // { value: "gg", label: "GGPoker", color: "text-gray-900", bg: "bg-gray-100", border: "border-gray-200" },
  // { value: "pokerstars", label: "PokerStars", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  { value: "unknown", label: "Unknown", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-100" },
];

export default function WdicSessionsPage() {
  const [sessions, setSessions] = useState<WdicSession[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Default เป็น "n8" (Natural8) ตามที่คุณใช้งานหลัก
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

      // ✅ ส่งค่า selectedSource ซึ่งจะเป็น "n8" (ตัวเล็ก) ไปที่ Backend
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div className="max-w-xl">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2 italic">
                WHY DID I <span className="text-red-600">CALL?</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 tracking-[0.3em] uppercase">
                Hand History Analytics
            </p>
          </div>
          
          {/* Upload Area */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            
            {/* ✅ Dropdown เลือก Platform */}
            <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-sm flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3">Platform:</span>
                <select 
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className={`
                        bg-transparent font-bold text-sm outline-none cursor-pointer py-1 px-2 rounded-lg
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
                  relative group border-2 border-dashed rounded-[2rem] p-8 transition-all text-center cursor-pointer
                  ${dragActive ? "border-red-600 bg-red-50 scale-105" : "border-gray-200 bg-white hover:border-red-400 shadow-sm"}
                  ${isBusy ? "opacity-50 pointer-events-none" : ""}
                `}
            >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".txt"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-2xl transition-colors ${dragActive ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  </div>
                  <div className="space-y-1">
                      <span className="block text-xs font-black text-gray-800 uppercase tracking-widest">
                          {isBusy ? "Importing..." : "Upload Session"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {error ? <span className="text-red-500">{error}</span> : `Drag ${currentSourceStyle.label} .txt`}
                      </span>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total Sessions" value={sessions.length.toString()} color="text-red-600" />
          <StatCard label="Analyzed Hands" value={sessions.reduce((acc, s) => acc + (s.handCount || 0), 0).toLocaleString()} color="text-gray-900" />
          <StatCard label="Active Platform" value={currentSourceStyle.label} color="text-gray-400" />
        </div>

        {/* Session List Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic">Recent History</h2>
            <button onClick={refresh} disabled={isBusy} className="text-[10px] font-black text-gray-400 hover:text-red-600 transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm disabled:opacity-50">
                Refresh
            </button>
        </div>
        
        {/* Session Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-gray-100 border-dashed">
              <div className="text-gray-200 font-black italic tracking-[0.4em] uppercase text-xl">No Data Found</div>
              <div className="mt-2 text-xs text-gray-400">Import your first session above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function SessionCard({ session }: { session: WdicSession }) {
  const dateStr = session.started_at 
    ? new Date(session.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})
    : new Date(session.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // แมป source จาก Backend ("n8") กลับมาเป็น Style
  const sourceStyle = SOURCE_OPTIONS.find(s => s.value === session.source) || SOURCE_OPTIONS[3];

  return (
    <Link href={`/wdic/sessions/${session.id}`} className="block h-full">
      <div className="group bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:border-red-200 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
        {/* Decorative BG */}
        <div className="absolute -top-6 -right-6 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 pointer-events-none">
           <span className="font-black text-8xl italic text-gray-900 uppercase">
             {session.source === 'n8' ? 'N8' : session.source === 'gg' ? 'GG' : 'PS'}
           </span>
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-4">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${sourceStyle.color} ${sourceStyle.bg} ${sourceStyle.border} inline-block`}>
              {sourceStyle.label}
            </span>
          </div>
          
          <h2 className="text-lg font-black text-gray-800 mb-1 group-hover:text-red-600 transition-colors truncate leading-tight">
            {session.name || "Untitled Session"}
          </h2>
          
          <div className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-wide">
            {dateStr}
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-end">
            <div>
              <div className="text-[9px] text-gray-300 uppercase font-black tracking-[0.2em] mb-1">Hands</div>
              <div className="text-3xl font-mono font-black text-gray-900 tracking-tighter">
                {session.handCount ?? 0}
              </div>
            </div>
            <div className="bg-gray-900 text-white group-hover:bg-red-600 p-3 rounded-2xl transition-all shadow-lg group-hover:scale-110 group-hover:rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">{label}</div>
      <div className={`text-4xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}