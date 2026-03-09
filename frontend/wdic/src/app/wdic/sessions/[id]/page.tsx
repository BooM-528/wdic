"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSessionHands } from "@/lib/wdic/api.client";
import { getGuestId } from "@/lib/guest.client";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  has_analysis?: boolean;
  is_recommended?: boolean;
}

interface WdicSessionData {
  id: string;
  name: string | null;
  source: string;
  handCount: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

interface PageData {
  session: WdicSessionData;
  hands: WdicHandData[];
}

// --- Icons ---
const TrophyIcon = () => (
  <svg className="w-5 h-5 text-green-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const TrendingDownIcon = () => (
  <svg className="w-5 h-5 text-red-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
);
const CoinsIcon = () => (
  <svg className="w-5 h-5 text-blue-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const ChartIcon = () => (
  <svg className="w-5 h-5 text-[#D9114A] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"/></svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

// --- Helper Functions ---
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
    BTN: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
    CO:  "bg-teal-50 text-teal-600 border-teal-200/50",
    HJ:  "bg-amber-50 text-amber-600 border-amber-200/50",
    MP:  "bg-orange-50 text-orange-600 border-orange-200/50",
    "UTG+2": "bg-rose-50 text-rose-600 border-rose-200/50",
    "UTG+1": "bg-rose-50 text-rose-600 border-rose-200/50",
    UTG:     "bg-red-50 text-red-600 border-red-200/50",
    SB:  "bg-indigo-50 text-indigo-600 border-indigo-200/50", 
    BB:  "bg-indigo-100/50 text-indigo-700 border-indigo-300/50",
  };

  const style = colors[pos] || colors[pos.split("+")[0]] || "bg-gray-50 text-gray-500 border-gray-200/50";
  
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border backdrop-blur-sm shadow-sm ${style} uppercase tracking-[0.1em] whitespace-nowrap w-fit`}>
      {pos}
    </span>
  );
}

function HandCards({ cardsStr, isBoard = false }: { cardsStr?: string | null, isBoard?: boolean }) {
  if (!cardsStr) return isBoard ? null : <span className="text-gray-300 text-xs italic opacity-50">No cards</span>;
  const cards = cardsStr.split(" ");
  return (
    <div className="flex gap-1.5">
      {cards.map((card, i) => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1).toLowerCase();
        let suitColor = "text-gray-800";
        let suitIcon = "";
        switch (suit) {
          case 'h': suitColor = "text-[#D9114A]"; suitIcon = "♥"; break;
          case 'd': suitColor = "text-blue-600"; suitIcon = "♦"; break;
          case 'c': suitColor = "text-emerald-600"; suitIcon = "♣"; break;
          case 's': suitColor = "text-gray-900"; suitIcon = "♠"; break;
        }
        return (
          <div key={i} className={`flex flex-col items-center justify-center ${isBoard ? 'w-8 h-10 md:w-9 md:h-12' : 'w-9 h-11 md:w-10 md:h-14'} bg-white border border-gray-200/80 rounded-lg shadow-sm font-sans select-none hover:-translate-y-1 transition-transform`}>
            <span className={`text-sm md:text-base font-bold leading-none ${suitColor}`}>{rank}</span>
            <span className={`text-[10px] md:text-xs leading-none ${suitColor} mt-0.5`}>{suitIcon}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page ---

export default function WdicSessionDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Api Filter States
  const [apiPosition, setApiPosition] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<string>('');
  const [apiRecommended, setApiRecommended] = useState<boolean>(false);

  // Local Filter States
  const [filterType, setFilterType] = useState<'all' | 'won' | 'lost' | 'folded'>('all');
  const [hideFolds, setHideFolds] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        getGuestId();
        const res = await getSessionHands(sessionId, 10000, {
          position: apiPosition,
          status: apiStatus,
          recommended: apiRecommended
        }); 
        setData(res as unknown as PageData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sessionId, apiPosition, apiStatus, apiRecommended]);

  const { session, hands } = data || { session: {} as any, hands: [] };

  // --- Calculations ---
  let totalProfit = 0;
  let grossProfit = 0;
  let maxWin = 0;
  let maxLoss = 0;
  let maxWinHandId = "";
  let maxLossHandId = "";

  // Calculate Duration
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
    const net = collected - invested;

    totalProfit += net;
    
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

        let forcedInvestment = ante;
        if (h.hero_position === 'SB') {
            forcedInvestment += Number(h.bb_value || 0) / 2;
        } else if (h.hero_position === 'BB') {
            forcedInvestment += Number(h.bb_value || 0);
        }
        
        const voluntaryInvested = invested - forcedInvestment;
        const isFold = (voluntaryInvested <= 0.1 && collected === 0) && net <= 0;

        if (filterType === 'won' && net <= 0) return false;
        if (filterType === 'lost' && (net >= 0 || isFold)) return false;
        if (filterType === 'folded' && !isFold) return false;

        if (hideFolds && isFold) return false;

        return true;
    });
  }, [data, filterType, hideFolds]);


  if (error) return <div className="min-h-screen flex items-center justify-center p-12 text-center text-[#D9114A] font-black tracking-widest text-xl">{error}</div>;
  if (!data || loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
          <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#D9114A] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-rose-100/50 animate-ping"></div>
          </div>
          <span className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
              {t("loading")}
          </span>
      </div>
  );

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20 pb-20 overflow-hidden">
      
      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="fixed top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <Link href="/wdic" className="inline-flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-white/80 backdrop-blur-md border border-white rounded-lg flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:bg-white transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </div>
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-widest">{t("back_to_dashboard")}</span>
              </Link>
            </div>
            <LanguageSwitcher />
        </div>

        {/* Session Header Card (Glassmorphism) */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden mb-8 group">
            
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-10">
                
                {/* Left: Info */}
                <div className="flex-1 w-full flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] text-[#D9114A] font-black uppercase tracking-widest bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100/50 shadow-sm backdrop-blur-sm">
                            {formatDate(session.started_at || session.created_at)}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-6">
                        {session.name || t("poker_session")}
                    </h1>
                    
                    {/* Tags */}
                    <div className="flex gap-3">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">{t("hands_played")}</span>
                            <span className="text-sm font-black text-gray-900">{session.handCount}</span>
                        </div>
                        {/* Duration */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white bg-white/80 backdrop-blur-md shadow-sm">
                            <ClockIcon />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:block">{t("duration")}</span>
                            <span className="text-sm font-black text-gray-700">
                                {durationStr.replace('h', t('hour_short')).replace('m', t('minute_short'))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:w-auto min-w-0 md:min-w-[320px]">
                    <Link href={maxWinHandId ? `/wdic/hands/${maxWinHandId}` : "#"} className={`bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-100/50 hover:border-green-300 hover:shadow-lg hover:-translate-y-1 p-5 rounded-3xl transition-all group/card ${!maxWinHandId && "pointer-events-none opacity-50"}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-green-700 font-bold uppercase tracking-widest">{t("biggest_win")}</span>
                            <TrophyIcon />
                        </div>
                        <div className="text-xl md:text-2xl font-black text-green-700 tracking-tighter group-hover/card:scale-105 transition-transform origin-left drop-shadow-sm">
                            +{maxWin.toLocaleString()}
                        </div>
                    </Link>

                    <Link href={maxLossHandId ? `/wdic/hands/${maxLossHandId}` : "#"} className={`bg-gradient-to-br from-red-50 to-orange-50/50 border border-red-100/50 hover:border-red-300 hover:shadow-lg hover:-translate-y-1 p-5 rounded-3xl transition-all group/card ${!maxLossHandId && "pointer-events-none opacity-50"}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-red-700 font-bold uppercase tracking-widest">{t("biggest_loss")}</span>
                            <TrendingDownIcon />
                        </div>
                        <div className="text-xl md:text-2xl font-black text-red-600 tracking-tighter group-hover/card:scale-105 transition-transform origin-left drop-shadow-sm">
                            {maxLoss === 0 ? "0" : maxLoss.toLocaleString()}
                        </div>
                    </Link>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50 p-5 rounded-3xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-widest">{t("total_won")}</span>
                            <CoinsIcon />
                        </div>
                        <div className="text-xl md:text-2xl font-black text-blue-700 tracking-tighter drop-shadow-sm">
                            +{grossProfit.toLocaleString()}
                        </div>
                    </div>

                    <div className={`p-5 rounded-3xl border shadow-sm ${totalProfit >= 0 ? 'bg-white/80 border-white' : 'bg-white/80 border-white'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t("net_result")}</span>
                            <ChartIcon />
                        </div>
                        <div className={`text-lg md:text-2xl font-black tracking-tighter drop-shadow-sm ${totalProfit >= 0 ? 'text-green-600' : 'text-[#D9114A]'}`}>
                            {totalProfit > 0 ? "+" : ""}{totalProfit.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-4 z-30 mb-6 bg-white/70 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl p-2.5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3 px-2 hidden lg:flex">
                    <span className="w-1.5 h-6 bg-[#D9114A] rounded-full"></span>
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">{t("hand_history")}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pb-1 md:pb-0">
                    
                    {/* Advanced Filters */}
                    <div className="flex items-center gap-2">
                        <select 
                            value={apiPosition} 
                            onChange={e => setApiPosition(e.target.value)}
                            className="bg-white border border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-600 rounded-xl px-3 py-2.5 outline-none shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                        >
                            <option value="">Pos: All</option>
                            <option value="BTN">BTN</option>
                            <option value="SB">SB</option>
                            <option value="BB">BB</option>
                            <option value="UTG">UTG</option>
                            <option value="HJ">HJ</option>
                            <option value="CO">CO</option>
                        </select>

                        <select
                            value={apiStatus}
                            onChange={e => setApiStatus(e.target.value)}
                            className="bg-white border border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-600 rounded-xl px-3 py-2.5 outline-none shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                        >
                            <option value="">Status: All</option>
                            <option value="analyzed">Analyzed</option>
                            <option value="unanalyzed">Unanalyzed</option>
                        </select>

                        <button 
                            onClick={() => setApiRecommended(!apiRecommended)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                                apiRecommended 
                                ? 'bg-amber-50 border-amber-200 text-amber-600' 
                                : 'bg-white border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-200'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={apiRecommended ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span className="hidden sm:inline">Recommended</span>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300/50 hidden lg:block mx-1"></div>

                    {/* Local Filters */}
                    <div className="flex bg-gray-100/50 p-1 rounded-xl flex-shrink-0 border border-gray-200/50">
                        {(['all', 'won', 'lost', 'folded'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filterType === type 
                                    ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)]' 
                                    : 'text-gray-400 hover:text-gray-700 hover:bg-white/50'
                                }`}
                            >
                                {t(`filter_${type}`)}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => setHideFolds(!hideFolds)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap flex-shrink-0 shadow-sm ${
                            hideFolds 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-white hover:border-blue-100 text-gray-500 hover:text-blue-600'
                        }`}
                    >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors border ${hideFolds ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-gray-50'}`}>
                            {hideFolds && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t("hide_folds")}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Hands List */}
        <div className="space-y-4">
          {filteredHands.map((h) => {
             const originalIdx = hands.findIndex(orig => orig.id === h.id);
             const handNumber = session.handCount - originalIdx;

             const collected = Number(h.hero_collected || 0);
             const invested = Number(h.hero_invested || 0);
             const bb = Number(h.bb_value || 0);
             const netProfit = collected - invested;
             
             const isWin = netProfit > 0;
             const isBreakEven = netProfit === 0 && invested > 0;
             
             const ante = Number(h.ante || 0);
             let forcedInvestment = ante;
             if (h.hero_position === 'SB') {
                 forcedInvestment += Number(h.bb_value || 0) / 2;
             } else if (h.hero_position === 'BB') {
                 forcedInvestment += Number(h.bb_value || 0);
             }
             const voluntaryInvested = invested - forcedInvestment;
             const isFold = (voluntaryInvested <= 0.1 && collected === 0) && netProfit <= 0;
             const isLoss = netProfit < 0 && !isFold;

             const bbText = bb > 0 ? formatBB(netProfit, bb) : "";

             return (
              <Link key={h.id} href={`/wdic/hands/${h.id}`} className="block group w-full focus-visible:outline-none focus-visible:ring-4 ring-rose-200 rounded-3xl">
                <div className="bg-white/60 backdrop-blur-md border border-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:bg-white/90 transition-all duration-300 cursor-pointer overflow-hidden relative">
                  
                  {isWin && <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>}
                  {isLoss && <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>}

                  <div className="grid grid-cols-[auto_1fr_auto] md:flex md:items-center gap-4 md:justify-between relative z-10 w-full">
                    
                    {/* Left: Hand# & Date Info */}
                    <div className="flex items-center gap-4 md:w-[180px] flex-shrink-0">
                        <div className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all shadow-sm flex-shrink-0 ${isWin ? 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-700' : isLoss ? 'bg-gradient-to-br from-red-50 to-rose-100 text-[#D9114A]' : 'bg-gray-50 text-gray-400 group-hover:from-gray-100 group-hover:to-gray-200'} relative`}>
                            {h.is_recommended && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md z-20 animate-bounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </div>
                            )}
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">{t("hand_short")}</span>
                            <span className="text-sm md:text-base font-black tracking-tighter leading-none">#{handNumber}</span>
                        </div>
                        <div className="flex flex-col justify-center gap-1.5 w-full">
                            <div className="flex items-center gap-2">
                                <PositionBadge pos={h.hero_position} />
                                {h.has_analysis && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200">AI</span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                {formatDate(h.started_at)}
                            </span>
                        </div>
                    </div>

                    {/* Cards Section: Hero + Board */}
                    <div className="col-span-3 md:col-span-1 md:flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-0 items-center mt-3 md:mt-0 order-3 md:order-2 w-full">
                        
                        {/* 1. Hero Cards */}
                        <div className="flex flex-col items-center md:items-center md:justify-self-end md:pr-6 w-full md:w-auto">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] hidden md:block text-center mb-1.5">Hero</span>
                            <HandCards cardsStr={h.hero_cards_str} />
                        </div>

                        {/* 2. Divider */}
                        <div className="hidden md:flex justify-center">
                            <div className={`w-px h-10 bg-gray-200 ${h.board_cards_str ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>

                        {/* 3. Board Cards */}
                        <div className="flex flex-col items-center md:items-center md:justify-self-start md:pl-6 min-w-[80px] w-full md:w-auto">
                            {h.board_cards_str && (
                                <>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] hidden md:block text-center mb-1.5">Board</span>
                                    <HandCards cardsStr={h.board_cards_str} isBoard={true} />
                                </>
                            )}
                        </div>

                    </div>

                    {/* Result (Chips + BB) */}
                    <div className="flex flex-col items-end justify-center md:w-[150px] flex-shrink-0 order-2 md:order-3">
                        {isWin ? (
                            <>
                                <span className="text-xl md:text-2xl font-black text-green-600 tracking-tighter drop-shadow-sm">+{netProfit.toLocaleString()}</span>
                                <span className="text-[10px] md:text-xs font-black text-green-600/70 uppercase tracking-widest mt-0.5 bg-green-50 px-2 py-0.5 rounded-md">
                                    (+{bbText})
                                </span>
                            </>
                        ) : isLoss ? (
                            <>
                                <span className="text-xl md:text-2xl font-black text-red-600 tracking-tighter drop-shadow-sm">{netProfit.toLocaleString()}</span>
                                <span className="text-[10px] md:text-xs font-black text-red-600/60 uppercase tracking-widest mt-0.5 bg-red-50/80 px-2 py-0.5 rounded-md">
                                    ({bbText})
                                </span>
                            </>
                        ) : isBreakEven ? (
                            <>
                                <span className="text-xl md:text-2xl font-black text-gray-400 tracking-tighter mt-1">0</span>
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">{t("break_even")}</span>
                            </>
                        ) : (
                            <div className="opacity-60 text-right w-full flex flex-col items-end">
                                <span className={`text-xl md:text-2xl font-black tracking-tighter mt-1 ${netProfit < 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {netProfit < 0 ? netProfit.toLocaleString() : '-'}
                                </span>
                                {netProfit < 0 && bbText && (
                                    <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mt-0.5 bg-gray-100 px-2 py-0.5 rounded-md">
                                        ({bbText})
                                    </span>
                                )}
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md mt-1">{t("folded")}</span>
                            </div>
                        )}
                        
                        {/* Interactive element - arrow pointing right */}
                        <div className="text-gray-300 group-hover:text-blue-500 transition-colors mt-2 hidden md:block">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                    </div>
                  
                  </div>
                </div>
              </Link>
            );
          })}
          
          {filteredHands.length === 0 && (
              <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white shadow-sm flex flex-col items-center">
                  <div className="text-4xl mb-4 opacity-50">👁️‍🗨️</div>
                  <span className="text-gray-900 font-black text-lg tracking-tight">{t("no_hands_found")}</span>
                  <span className="text-sm font-medium text-gray-500 mt-2">{t("no_hands_found_desc")}</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}