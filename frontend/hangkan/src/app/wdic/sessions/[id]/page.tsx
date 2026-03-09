"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSessionHands } from "@/lib/wdic/api.client";
import { getGuestId } from "@/lib/guest.client";

// --- Types ---
interface WdicHandData {
  id: string;
  hand_no: string | null;
  started_at: string | null;
  created_at: string;
  hero_position: string | null;
  hero_cards_str: string | null;
  board_cards_str?: string | null;
  hero_collected: number | string;
  hero_invested: number | string;
  ante?: number | string;
  bb_value?: number | string;
}

// ✅ อัปเดต Interface ตามที่ขอ
interface WdicSessionData {
  id: string;
  name: string | null;
  source: string;
  handCount: number;
  created_at: string;
  started_at: string | null; // เพิ่ม started_at
  ended_at: string | null;     // เพิ่ม ended_at
}

interface PageData {
  session: WdicSessionData;
  hands: WdicHandData[];
}

// --- Icons ---
const TrophyIcon = () => (
  <svg className="w-4 h-4 text-green-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const TrendingDownIcon = () => (
  <svg className="w-4 h-4 text-red-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
);
const CoinsIcon = () => (
  <svg className="w-4 h-4 text-blue-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const ChartIcon = () => (
  <svg className="w-4 h-4 text-gray-500 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"/></svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

// --- Helper Functions ---

// ✅ Format วันที่: YYYY/MM/DD HH:mm
function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function formatBB(amount: number, bb: number): string {
    if (!bb || bb === 0) return "";
    const val = amount / bb;
    return `${Math.abs(val).toFixed(1)} BB`;
}

function PositionBadge({ pos }: { pos?: string | null }) {
  if (!pos || pos === "UNK" || pos === "OBS") return <span className="text-gray-300 text-[10px]">-</span>;
  
  const colors: Record<string, string> = {
    BTN: "bg-emerald-100 text-emerald-800 border border-emerald-500",
    CO:  "bg-teal-50 text-teal-700 border border-teal-500",
    HJ:  "bg-amber-50 text-amber-700 border border-amber-500",
    MP:  "bg-orange-50 text-orange-700 border border-orange-500",
    "UTG+2": "bg-rose-50 text-rose-700 border border-rose-500",
    "UTG+1": "bg-rose-50 text-rose-700 border border-rose-500",
    UTG:     "bg-red-50 text-red-700 border border-red-500",
    SB:  "bg-indigo-50 text-indigo-700 border border-indigo-500", 
    BB:  "bg-indigo-100 text-indigo-900 border border-indigo-600",
  };

  const style = colors[pos] || colors[pos.split("+")[0]] || "bg-gray-50 text-gray-600 border border-gray-400";
  
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${style} uppercase tracking-wider shadow-md ring-1 ring-white/50 whitespace-nowrap`}>
      {pos}
    </span>
  );
}

function HandCards({ cardsStr, isBoard = false }: { cardsStr?: string | null, isBoard?: boolean }) {
  if (!cardsStr) return isBoard ? null : <span className="text-gray-300 text-xs italic opacity-50">No cards</span>;
  const cards = cardsStr.split(" ");
  return (
    <div className="flex gap-1">
      {cards.map((card, i) => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1).toLowerCase();
        let suitColor = "text-gray-800";
        let suitIcon = "";
        switch (suit) {
          case 'h': suitColor = "text-red-600"; suitIcon = "♥"; break;
          case 'd': suitColor = "text-blue-600"; suitIcon = "♦"; break;
          case 'c': suitColor = "text-green-600"; suitIcon = "♣"; break;
          case 's': suitColor = "text-black"; suitIcon = "♠"; break;
        }
        return (
          <div key={i} className={`flex flex-col items-center justify-center ${isBoard ? 'w-7 h-9 md:w-8 md:h-10' : 'w-8 h-10 md:w-9 md:h-11'} bg-white border border-gray-200 rounded-lg shadow-sm font-sans select-none`}>
            <span className={`text-xs md:text-sm font-bold leading-none ${suitColor}`}>{rank}</span>
            <span className={`text-[9px] md:text-[10px] leading-none ${suitColor} mt-0.5`}>{suitIcon}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page ---

export default function WdicSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'won' | 'lost'>('all');
  const [hideFolds, setHideFolds] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        getGuestId();
        const res = await getSessionHands(sessionId, 10000); 
        setData(res as unknown as PageData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sessionId]);

  const { session, hands } = data || { session: {} as any, hands: [] };

  // --- Calculations ---
  let totalProfit = 0;
  let totalBBProfit = 0;
  let grossProfit = 0;
  let maxWin = 0;
  let maxLoss = 0;
  let maxWinHandId = "";
  let maxLossHandId = "";

  // ✅ คำนวณ Session Duration จาก session.started_at และ session.ended_at
  let durationStr = "0m";
  if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      const diff = end - start;
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      durationStr = "";
      if (hrs > 0) durationStr += `${hrs}h `;
      durationStr += `${mins}m`;
  }

  (data?.hands || []).forEach(h => {
    const collected = Number(h.hero_collected || 0);
    const invested = Number(h.hero_invested || 0);
    const bb = Number(h.bb_value || 0);
    const net = collected - invested;

    totalProfit += net;
    
    if (bb > 0) {
        totalBBProfit += (net / bb);
    }
    
    if (net > 0) {
        grossProfit += net;
        if (net > maxWin) { maxWin = net; maxWinHandId = h.id; }
    } else if (net < 0) {
        if (net < maxLoss) { maxLoss = net; maxLossHandId = h.id; }
    }
  });

  // --- Filter Logic ---
  const filteredHands = useMemo(() => {
    if (!data) return [];
    return data.hands.filter(h => {
        const collected = Number(h.hero_collected || 0);
        const invested = Number(h.hero_invested || 0);
        const ante = Number(h.ante || 0);
        const net = collected - invested;

        if (filterType === 'won' && net <= 0) return false;
        if (filterType === 'lost' && net >= 0) return false;

        if (hideFolds) {
             const voluntaryInvested = invested - ante;
             if (voluntaryInvested <= 0 && collected === 0) return false;
        }

        return true;
    });
  }, [data, filterType, hideFolds]);


  if (error) return <div className="p-12 text-center text-red-500 font-bold">{error}</div>;
  if (!data || loading) return <div className="p-12 text-center text-gray-400 font-bold animate-pulse">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 font-sans text-gray-900 pb-20">
      <div className="max-w-5xl mx-auto">
        
        <Link href="/wdic" className="inline-flex items-center text-gray-400 hover:text-gray-900 font-bold text-[10px] uppercase tracking-widest mb-6 transition-colors">
          ← Back
        </Link>

        {/* Session Header Card */}
        <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-10">
                
                {/* Left: Info */}
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-3">
                        {/* ✅ แสดงวันเวลาเริ่ม session (started_at) แทน created_at */}
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                            {formatDate(session.started_at || session.created_at)}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                        {session.name || "Poker Session"}
                    </h1>
                    
                    {/* Tags */}
                    <div className="flex gap-2">
                        <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hands</span>
                            <span className="text-sm font-black text-gray-900">{session.handCount}</span>
                        </div>
                        {/* Duration */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duration</span>
                            <ClockIcon />
                            <span className="text-sm font-black text-gray-700">
                                {durationStr}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:w-auto min-w-[300px]">
                    <Link href={maxWinHandId ? `/wdic/hands/${maxWinHandId}` : "#"} className={`bg-green-50/50 hover:bg-green-50 border border-green-100/50 hover:border-green-200 p-4 rounded-2xl transition-all group ${!maxWinHandId && "pointer-events-none opacity-50"}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] text-green-700/60 font-black uppercase tracking-widest">Biggest Win</span>
                            <TrophyIcon />
                        </div>
                        <div className="text-lg md:text-xl font-black text-green-700 tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            +{maxWin.toLocaleString()}
                        </div>
                    </Link>

                    <Link href={maxLossHandId ? `/wdic/hands/${maxLossHandId}` : "#"} className={`bg-red-50/50 hover:bg-red-50 border border-red-100/50 hover:border-red-200 p-4 rounded-2xl transition-all group ${!maxLossHandId && "pointer-events-none opacity-50"}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] text-red-700/60 font-black uppercase tracking-widest">Biggest Loss</span>
                            <TrendingDownIcon />
                        </div>
                        <div className="text-lg md:text-xl font-black text-red-600 tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            {maxLoss === 0 ? "0" : maxLoss.toLocaleString()}
                        </div>
                    </Link>

                    <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] text-blue-700/60 font-black uppercase tracking-widest">Total Won</span>
                            <CoinsIcon />
                        </div>
                        <div className="text-lg md:text-xl font-black text-blue-600 tracking-tighter">
                            +{grossProfit.toLocaleString()}
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${totalProfit >= 0 ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Net Result</span>
                            <ChartIcon />
                        </div>
                        <div className={`text-lg md:text-xl font-black tracking-tighter ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalProfit > 0 ? "+" : ""}{totalProfit.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-0 z-20 bg-[#F8F9FA]/95 backdrop-blur-sm py-2 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2 hidden md:block">Hand History</h2>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                        {(['all', 'won', 'lost'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                    filterType === type 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>
                    <button 
                        onClick={() => setHideFolds(!hideFolds)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex-shrink-0 ${
                            hideFolds 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${hideFolds ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {hideFolds && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-xs font-bold">Hide Folds</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Hands List */}
        <div className="space-y-3">
          {filteredHands.map((h) => {
             const originalIdx = hands.findIndex(orig => orig.id === h.id);
             const handNumber = session.handCount - originalIdx;

             const collected = Number(h.hero_collected || 0);
             const invested = Number(h.hero_invested || 0);
             const bb = Number(h.bb_value || 0);
             const netProfit = collected - invested;
             
             const isWin = netProfit > 0;
             const isLoss = netProfit < 0;
             const isBreakEven = netProfit === 0 && invested > 0;

             const bbText = bb > 0 ? formatBB(netProfit, bb) : "";

             return (
              <Link key={h.id} href={`/wdic/hands/${h.id}`} className="block group">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                  
                  {/* Mobile Grid */}
                  <div className="grid grid-cols-[auto_1fr_auto] md:flex md:items-center gap-3 md:justify-between">
                    
                    {/* Left: Hand# & Date Info */}
                    <div className="flex items-center gap-3 md:w-[160px] flex-shrink-0">
                        <div className={`flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-colors flex-shrink-0 ${isWin ? 'bg-green-50 text-green-700' : isLoss ? 'bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Hand</span>
                            <span className="text-xs md:text-sm font-bold">#{handNumber}</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-0.5">
                                <PositionBadge pos={h.hero_position} />
                            </div>
                            {/* ✅ เปลี่ยนเป็นแสดงเวลา started_at format ใหม่ */}
                            <span className="text-[9px] font-bold text-gray-400">
                                {formatDate(h.started_at)}
                            </span>
                        </div>
                    </div>

                    {/* Cards Section: Hero + Board (Grid Layout Fixed) */}
                    <div className="col-span-3 md:col-span-1 md:flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-0 items-center mt-2 md:mt-0 order-3 md:order-2">
                        
                        {/* 1. Hero Cards */}
                        <div className="flex flex-col items-center md:items-center md:justify-self-end md:pr-4">
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest hidden md:block text-center mb-1">Hero</span>
                            <HandCards cardsStr={h.hero_cards_str} />
                        </div>

                        {/* 2. Divider */}
                        <div className="hidden md:flex justify-center">
                            <div className={`w-px h-8 bg-gray-100 ${h.board_cards_str ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>

                        {/* 3. Board Cards */}
                        <div className="flex flex-col items-center md:items-center md:justify-self-start md:pl-4 min-w-[80px]">
                            {h.board_cards_str && (
                                <>
                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest hidden md:block text-center mb-1">Board</span>
                                    <HandCards cardsStr={h.board_cards_str} isBoard={true} />
                                </>
                            )}
                        </div>

                    </div>

                    {/* Result (Chips + BB) */}
                    <div className="flex flex-col items-end justify-center md:w-[140px] flex-shrink-0 order-2 md:order-3">
                        {isWin ? (
                            <>
                                <span className="text-sm md:text-lg font-black text-green-600 tracking-tight">+{netProfit.toLocaleString()}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-green-500/80 uppercase tracking-wide">
                                    (+{bbText})
                                </span>
                            </>
                        ) : isLoss ? (
                            <>
                                <span className="text-sm md:text-lg font-black text-red-600 tracking-tight">{netProfit.toLocaleString()}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-red-400/80 uppercase tracking-wide">
                                    ({bbText})
                                </span>
                            </>
                        ) : isBreakEven ? (
                            <>
                                <span className="text-sm md:text-lg font-black text-gray-400 tracking-tight">0</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-gray-300 uppercase tracking-wide">Break Even</span>
                            </>
                        ) : (
                            <div className="opacity-50 text-right">
                                <span className="text-sm md:text-lg font-bold text-gray-300 tracking-tight">-</span>
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-300 uppercase tracking-wide block">Folded</span>
                            </div>
                        )}
                    </div>
                  
                  </div>
                </div>
              </Link>
            );
          })}
          
          {filteredHands.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-gray-400 font-bold text-sm">No hands match this filter</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}