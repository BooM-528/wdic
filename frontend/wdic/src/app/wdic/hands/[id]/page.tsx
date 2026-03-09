"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGuestId } from "@/lib/guest.client";
import { getHandDetail } from "@/lib/wdic/api.client"; 

// --- 1. Helper Functions ---

function formatNumber(num: number) {
  return num.toLocaleString();
}

function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function formatBB(amount: number, bb: number) {
  if (!bb || bb === 0) return "";
  return (amount / bb).toFixed(1) + " BB";
}

function getUniqueBoard(cards: string[]) {
  if (!cards) return [];
  return Array.from(new Set(cards));
}

function parseTableRoster(rawText: string | undefined, totalPlayers: number, btnSeat: number) {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const players: any[] = [];

  lines.forEach(line => {
    const match = line.match(/^Seat (\d+):\s*(.+?)\s*\(([\d,]+) in chips\)/i);
    if (match) {
      players.push({
        seat: parseInt(match[1]),
        name: match[2].trim(),
        stack: parseInt(match[3].replace(/,/g, "")),
      });
    }
  });

  const sortedPlayers = players.sort((a, b) => a.seat - b.seat);
  const btnIndex = sortedPlayers.findIndex(p => p.seat === btnSeat);
  
  const count = sortedPlayers.length;
  return sortedPlayers.map((p, idx) => {
    let pos = "UNK";
    if (btnIndex !== -1) {
        const rel = (idx - btnIndex + count) % count;
        if (count === 2) pos = rel === 0 ? "BTN/SB" : "BB";
        else {
            if (rel === 0) pos = "BTN";
            else if (rel === 1) pos = "SB";
            else if (rel === 2) pos = "BB";
            else if (rel === count - 1) pos = "CO";
            else if (rel === count - 2) pos = "HJ";
            else if (rel === count - 3) pos = "MP";
            else pos = "UTG";
        }
    }
    return { ...p, pos };
  });
}

function calculateAllPlayersNet(roster: any[], actions: any[], winners: any[]) {
    const stats: Record<string, { invested: number, collected: number, net: number }> = {};
    
    roster.forEach(p => { stats[p.name] = { invested: 0, collected: 0, net: 0 }; });
    if (!stats["Hero"]) stats["Hero"] = { invested: 0, collected: 0, net: 0 };

    actions.forEach(act => {
        if (!stats[act.actor]) stats[act.actor] = { invested: 0, collected: 0, net: 0 };
        if (act.verb === "return") stats[act.actor].invested -= act.amount;
        else stats[act.actor].invested += act.amount;
    });

    winners.forEach(w => {
        if (!stats[w.player]) stats[w.player] = { invested: 0, collected: 0, net: 0 };
        stats[w.player].collected += w.amount;
    });

    Object.keys(stats).forEach(key => {
        stats[key].net = stats[key].collected - stats[key].invested;
    });

    return stats;
}

function getPlayerKnownCards(heroName: string, heroCardsStr: string | null, actions: any[]) {
    const knownCards: Record<string, string[]> = {};
    
    if (heroCardsStr) {
        knownCards[heroName] = heroCardsStr.split(" ");
    }

    actions.forEach(act => {
        if (act.verb === "shows" && act.raw) {
            const match = act.raw.match(/\[([2-9TJQKA][shdc].*?)\]/);
            if (match) {
                knownCards[act.actor] = match[1].split(" ");
            }
        }
    });

    return knownCards;
}

// --- 2. Components ---

// ✅ PositionBadge: สไตล์มีขอบเข้ม (Final Style)
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

function Card({ card, size = "md" }: { card: string; size?: "sm" | "md" | "lg" }) {
  if (!card) return null;
  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toLowerCase();
  
  let color = "text-gray-800";
  let icon = "";
  switch (suit) {
    case 'h': color = "text-[#D9114A]"; icon = "♥"; break;
    case 'd': color = "text-blue-600"; icon = "♦"; break;
    case 'c': color = "text-emerald-600"; icon = "♣"; break;
    case 's': color = "text-gray-900"; icon = "♠"; break;
  }

  const sizeClasses = {
      lg: "w-12 h-16 md:w-14 md:h-20 text-lg md:text-2xl rounded-xl shadow-sm",
      md: "w-10 h-14 md:w-10 md:h-14 text-sm md:text-base rounded-lg shadow-sm font-black",
      sm: "w-9 h-12 md:w-10 md:h-14 text-xs md:text-sm rounded-lg border shadow-sm font-black"
  };

  return (
    <div className={`${sizeClasses[size]} flex flex-col items-center justify-center bg-white border border-gray-100 select-none group-hover:shadow-md transition-shadow`}>
      <span className={`font-black leading-none ${color}`}>{rank}</span>
      <span className={`leading-none ${color} mt-0.5 opacity-80`}>{icon}</span>
    </div>
  );
}

function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        lg: "w-12 h-16 md:w-14 md:h-20 rounded-md md:rounded-lg",
        md: "w-10 h-14 md:w-10 md:h-14 rounded",
        sm: "w-9 h-12 md:w-10 md:h-14 rounded-sm"
    };
    return (
        <div className={`${sizeClasses[size]} bg-blue-900 border border-white/50 shadow-sm flex items-center justify-center`}>
            <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        </div>
    );
}

function BoardDisplay({ cards, size = "md" }: { cards: string[], size?: "sm"|"md"|"lg" }) {
  const unique = getUniqueBoard(cards);
  if (unique.length === 0) return <div className="text-gray-400 text-xs italic">No Board</div>;
  return (
    <div className="flex gap-1">
      {unique.map((c, i) => <Card key={i} card={c} size={size} />)}
    </div>
  );
}

function ActionBadge({ verb }: { verb: string }) {
  const v = verb.toLowerCase();
  let style = "bg-gray-50 text-gray-400 border-gray-100";
  
  if (v.includes("all-in")) {
      style = "bg-[#D9114A] text-white border-rose-400/50 font-black shadow-[0_4px_12px_rgba(217,17,74,0.3)] ring-2 ring-white/20";
  }
  else if (v.includes("fold")) style = "bg-gray-100/50 text-gray-300 border-gray-100 line-through decoration-gray-300/50";
  else if (v.includes("check")) style = "bg-gray-100 text-gray-500 border-gray-200/50";
  else if (v.includes("call")) style = "bg-blue-50 text-blue-600 border-blue-200/50";
  else if (v.includes("bet")) style = "bg-orange-50 text-orange-600 border-orange-200/50";
  else if (v.includes("raise")) style = "bg-rose-50 text-[#D9114A] border-rose-200/50 font-black";
  else if (v.includes("return")) style = "bg-green-50 text-green-600 border-green-200/50";
  else if (v.includes("show")) style = "bg-purple-50 text-purple-600 border-purple-200/50 font-black";
  
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-[0.1em] border shadow-sm ${style} block w-fit transition-transform hover:scale-105`}>
      {verb}
    </span>
  );
}

// --- 3. PokerTable (Final: Mobile Vertical / Desktop Horizontal) ---
function PokerTable({ roster, heroName, board, pot, winners, bb, shownCards }: any) {
  const heroIndex = roster.findIndex((p: any) => p.name === heroName);
  const sortedRoster = heroIndex !== -1 
    ? [...roster.slice(heroIndex), ...roster.slice(0, heroIndex)]
    : roster;

  const count = sortedRoster.length;
  
  let seatPositions: string[] = [];
  if (count <= 6) {
      seatPositions = [
        "bottom-[-20px] left-1/2 -translate-x-1/2", 
        "bottom-[18%] left-[-45px]",                 
        "top-[18%] left-[-45px]",                    
        "top-[-20px] left-1/2 -translate-x-1/2",     
        "top-[18%] right-[-45px]",                   
        "bottom-[18%] right-[-45px]",                
      ];
  } else {
      seatPositions = [
        "bottom-[-20px] left-1/2 -translate-x-1/2", 
        "bottom-[10%] left-[-35px]",                 
        "left-[-65px] top-1/2 -translate-y-1/2",     
        "top-[10%] left-[-35px]",                    
        "top-[-20px] left-[30%] -translate-x-1/2",   
        "top-[-20px] right-[30%] translate-x-1/2",   
        "top-[10%] right-[-35px]",                   
        "right-[-65px] top-1/2 -translate-y-1/2",    
        "bottom-[10%] right-[-35px]",                
      ];
  }

  return (
    <div className="relative mx-auto bg-transparent my-16 md:my-28 select-none origin-center 
        w-[320px] h-[540px] md:w-[700px] md:h-[350px] scale-[0.85] sm:scale-100 md:scale-100">
      
      {/* Table Felt */}
      <div className="absolute inset-4 bg-[#35654d] border-[8px] border-[#2c3e50] shadow-2xl flex flex-col items-center justify-center 
        rounded-[100px] md:rounded-[150px]">
        
        {/* Center Info */}
        <div className="z-10 flex flex-col items-center gap-3 md:gap-2">
            <div className="bg-black/40 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
                Pot: {formatNumber(pot)}
                <span className="text-[9px] opacity-70 ml-1 font-normal">({formatBB(pot, bb)})</span>
            </div>
            <div className="flex gap-1.5 shadow-2xl">
                {board.map((c: string, i: number) => <Card key={i} card={c} size="md" />)}
                {board.length === 0 && <div className="h-14 w-32 flex items-center justify-center text-white/20 text-xs font-bold border-2 border-dashed border-white/10 rounded-lg">Wait for Flop</div>}
            </div>
        </div>
      </div>

      {/* Players */}
      {sortedRoster.map((player: any, index: number) => {
        const isHero = player.name === heroName;
        const isWinner = winners?.some((w: any) => w.player === player.name);
        const posClass = seatPositions[index] || "hidden"; 
        const myCards = shownCards[player.name];

        return (
          <div key={player.seat} className={`absolute ${posClass} flex flex-col items-center transition-all duration-500 z-30 w-[90px] md:w-[110px]`}>
            
            {/* WIN Bubble: อยู่เหนือไพ่ (-top-9) */}
            {isWinner && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white whitespace-nowrap z-[60]">
                    WIN!
                </div>
            )}

            {/* Cards Layer */}
            <div className="relative z-20 mb-[-10px]"> 
                {myCards ? (
                    <div className="flex gap-0.5 shadow-lg transform hover:scale-110 transition-transform">
                        <Card card={myCards[0]} size="sm" />
                        <Card card={myCards[1]} size="sm" />
                    </div>
                ) : (
                    <div className="flex gap-0.5 shadow-md">
                        <CardBack size="sm" />
                        <CardBack size="sm" />
                    </div>
                )}
            </div>

            {/* Info Panel */}
            <div className={`relative flex flex-col items-center text-center rounded-lg px-2 py-1 pt-3 border shadow-md w-full z-30 backdrop-blur-sm
                ${isHero ? 'bg-blue-900/95 border-blue-600 text-white' : 'bg-gray-900/95 border-gray-600 text-white'}
                ${isWinner ? 'ring-2 ring-yellow-400 border-yellow-400' : ''}
            `}>
                
                {/* Position Badge: บนขอบ Panel */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-50">
                    <PositionBadge pos={player.pos} />
                </div>

                <div className={`text-[9px] font-bold truncate w-full mt-1 ${isHero ? 'text-blue-200' : 'text-gray-300'}`}>
                    {player.name}
                </div>
                
                <div className="text-[10px] font-mono font-bold text-yellow-400 whitespace-nowrap leading-tight">
                    {formatNumber(player.stack)} 
                    <span className="text-[8px] text-white/60 font-sans ml-1">({formatBB(player.stack, bb)})</span>
                </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

// --- 4. Main Page ---

export default function HandDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        getGuestId();
        const res = await getHandDetail(params.id); 
        setData(res);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    }
    void load();
  }, [params.id]);

  const roster = useMemo(() => {
    if (!data) return [];
    return parseTableRoster(data.raw_text, data.max_players, data.button_seat);
  }, [data]);

  const heroPos = useMemo(() => {
      if (!roster) return "UNK";
      const heroP = roster.find((p:any) => p.name === "Hero");
      return heroP ? heroP.pos : "UNK";
  }, [roster]);

  const playerStats = useMemo(() => {
      if (!data) return {};
      return calculateAllPlayersNet(roster, data.actions_json?.actions || [], data.actions_json?.winners || []);
  }, [data, roster]);

  if (loading || !data) return <div className="p-12 text-center text-gray-400 font-bold animate-pulse">LOADING HAND HISTORY...</div>;

  const {
    hand_no, hero_cards_str, hero_collected, hero_invested,
    bb_value, actions_json, created_at, session_id,
    board_cards_str, started_at
  } = data;

  const collected = Number(hero_collected || 0);
  const invested = Number(hero_invested || 0);
  const net = collected - invested;
  const isWin = net > 0;
  const bb = Number(bb_value || 0);
  
  const winners = actions_json?.winners || [];
  const isSplitPot = winners.length > 1 && winners.some((w: any) => w.player === "Hero");
  const totalPot = actions_json?.total_pot || 0;

  const rawActions = actions_json?.actions || [];
  const sections: any = {
      SETUP: [],
      PREFLOP: [],
      FLOP: [],
      TURN: [],
      RIVER: [],
      SHOWDOWN: [],
      SUMMARY: []
  };

  rawActions.forEach((act: any) => {
    const s = act.street;
    const v = act.verb.toLowerCase();
    
    if (s === "PREFLOP") {
        if (v.includes("post") || v.includes("ante")) sections.SETUP.push(act);
        else sections.PREFLOP.push(act);
    } 
    else if (sections[s]) {
        sections[s].push(act);
    } else {
        if (s === "SUMMARY") sections.SUMMARY.push(act);
        else sections.SHOWDOWN.push(act);
    }
  });

  const fullBoard = board_cards_str ? board_cards_str.split(" ") : getUniqueBoard(actions_json?.board_cards || []);
  const shownCards = getPlayerKnownCards("Hero", hero_cards_str, rawActions);

  const flopCards = fullBoard.slice(0, 3);
  const turnCards = fullBoard.slice(3, 4);
  const riverCards = fullBoard.slice(4, 5);

  const heroLabel = `Hero (${heroPos})`;

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
            <Link href={`/wdic/sessions/${session_id}`} className="inline-flex items-center gap-2 group">
                <div className="w-8 h-8 bg-white/80 backdrop-blur-md border border-white rounded-lg flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:bg-white transition-all shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-widest">Back to Session</span>
            </Link>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-[#D9114A] uppercase tracking-widest bg-rose-50/50 px-3 py-1 rounded-xl border border-rose-100/50 shadow-sm backdrop-blur-sm">Hand #{hand_no}</span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{formatDate(started_at)}</span>
            </div>
        </div>

        <div className="space-y-8">

          {/* 1. Header Layout (Premium Glassmorphism) */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                  
                  {/* Left: Cards Group */}
                  <div className="order-2 lg:order-1 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                       {/* Hero Hand */}
                       <div className="text-center group/cards">
                           <div className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-[0.2em] flex items-center justify-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                               Hero <PositionBadge pos={heroPos} />
                           </div>
                           <div className="flex gap-2 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 backdrop-blur-sm group-hover/cards:scale-105 transition-transform">
                               {hero_cards_str?.split(" ").map((c:string, i:number) => <Card key={i} card={c} size="lg" />)}
                           </div>
                       </div>

                       {/* Board */}
                       {fullBoard.length > 0 && (
                           <div className="text-center group/board">
                               <div className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">Board</div>
                               <div className="flex gap-1.5 p-3 bg-white/50 rounded-2xl border border-white shadow-sm group-hover/board:scale-105 transition-transform">
                                   <BoardDisplay cards={fullBoard} size="lg" />
                               </div>
                           </div>
                       )}
                  </div>

                  {/* Right: Result Group */}
                  <div className="order-1 lg:order-2 flex flex-col items-center lg:items-end w-full lg:w-auto">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 border shadow-sm ${isWin ? 'bg-green-50 text-green-700 border-green-100' : net < 0 ? 'bg-rose-50 text-[#D9114A] border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {isSplitPot ? "Split Pot" : isWin ? "You Won" : "You Lost"}
                      </span>
                      
                      <div className="flex flex-col items-center lg:items-end">
                          <h1 className={`text-4xl md:text-6xl font-black tracking-tighter leading-none drop-shadow-sm ${net >= 0 ? 'text-green-600' : 'text-[#D9114A]'}`}>
                              {net > 0 ? "+" : ""}{formatNumber(net)}
                          </h1>
                          {bb > 0 && (
                              <span className={`px-3 py-1 rounded-lg text-xs font-black mt-2 shadow-sm ${net >= 0 ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-[#D9114A]'}`}>
                                  {(net/bb).toFixed(1)} BB
                              </span>
                          )}
                      </div>
                  </div>

              </div>
          </div>

          {/* 2. POKER TABLE VISUALIZATION */}
          <div className="relative py-12">
              <PokerTable 
                  roster={roster} 
                  heroName="Hero" 
                  board={fullBoard} 
                  pot={totalPot}
                  winners={winners}
                  bb={bb}
                  shownCards={shownCards} 
              />
          </div>

          {/* 3. TABLE ROSTER (Players List) */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm overflow-hidden">
              <div className="bg-white/40 px-6 py-3 border-b border-white/50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Table Roster</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-3 py-1 rounded-lg">Blinds: {formatNumber(actions_json?.blinds?.sb)} / {formatNumber(bb)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-white/50">
                  {roster.map((p: any) => {
                      const isHero = p.name === "Hero";
                      return (
                          <div key={p.seat} className={`p-5 text-center flex flex-col items-center justify-center transition-colors hover:bg-white/40 ${isHero ? 'bg-blue-50/30' : ''}`}>
                              <div className="mb-2">
                                  <PositionBadge pos={p.pos} />
                              </div>
                              <div className={`text-sm font-black truncate max-w-[100px] mb-1 ${isHero ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</div>
                              <div className="text-[11px] font-mono font-bold text-gray-500">{formatNumber(p.stack)}</div>
                              <div className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">{formatBB(p.stack, bb)}</div>
                          </div>
                      )
                  })}
              </div>
          </div>

          {/* 4. THE HAND TABLE (Action Grid) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
              
              {/* Setup */}
              {sections.SETUP.length > 0 && (
                  <div className="bg-gray-50/50 border-b border-white px-6 py-3 text-[10px] text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
                      <span className="font-black uppercase tracking-[0.2em] text-gray-400">Setup Actions</span>
                      {sections.SETUP.map((act: any, i: number) => (
                          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                              <b className={`font-black uppercase ${act.actor==="Hero"?"text-blue-500":"text-gray-500"}`}>{act.actor==="Hero"?"Hero":roster.find((r:any)=>r.name===act.actor)?.pos}</b> 
                              <span className="opacity-60">{act.verb}</span> 
                              <b className="font-mono text-gray-600">{formatNumber(act.amount)}</b>
                          </span>
                      ))}
                  </div>
              )}

              <div className="w-full">
                  <StreetHeader title="PREFLOP" />
                  <ActionTable actions={sections.PREFLOP} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} />

                  {sections.FLOP.length > 0 && (
                      <>
                          <StreetHeader title="FLOP" cards={flopCards} />
                          <ActionTable actions={sections.FLOP} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} />
                      </>
                  )}

                  {(sections.TURN.length > 0 || turnCards.length > 0) && (
                      <>
                          <StreetHeader title="TURN" cards={turnCards} />
                          <ActionTable actions={sections.TURN} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} />
                      </>
                  )}

                  {(sections.RIVER.length > 0 || riverCards.length > 0) && (
                      <>
                          <StreetHeader title="RIVER" cards={riverCards} />
                          <ActionTable actions={sections.RIVER} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} />
                      </>
                  )}

                  {sections.SHOWDOWN.length > 0 && (
                      <>
                          <StreetHeader title="SHOWDOWN" color="bg-rose-50/50 border-rose-100/50" textColor="text-[#D9114A]" />
                          <ActionTable actions={sections.SHOWDOWN} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} isShowdown />
                      </>
                  )}
              </div>
          </div>

          {/* 5. NET RESULT SUMMARY */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white overflow-hidden shadow-sm max-w-2xl mx-auto">
              <div className="bg-gray-900/90 backdrop-blur-md px-6 py-3">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Performance Summary</span>
              </div>
              <div className="divide-y divide-white/50">
                  {Object.entries(playerStats).map(([player, stat]: any) => {
                      if (stat.invested === 0 && stat.collected === 0) return null;
                      const isHero = player === "Hero";
                      const pInfo = roster.find((r:any)=>r.name===player);
                      const pNet = stat.net;

                      return (
                          <div key={player} className={`flex justify-between items-center px-6 py-4 transition-colors hover:bg-white/40 ${isHero ? 'bg-blue-50/20' : ''}`}>
                              <div className="flex items-center gap-3 w-1/3">
                                  <PositionBadge pos={pInfo?.pos} />
                                  <span className={`text-sm font-black ${isHero ? 'text-blue-600' : 'text-gray-800'}`}>{player}</span>
                              </div>
                              <div className="w-1/3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  {stat.invested > 0 && `Invested: ${formatNumber(stat.invested)}`}
                              </div>
                              <div className="w-1/3 text-right flex flex-col items-end">
                                  <span className={`text-sm md:text-base font-black tracking-tight ${pNet > 0 ? 'text-green-600' : pNet < 0 ? 'text-[#D9114A]' : 'text-gray-400'}`}>
                                      {pNet > 0 ? "+" : ""}{formatNumber(pNet)}
                                  </span>
                                  {bb > 0 && pNet !== 0 && (
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg mt-1 shadow-sm ${pNet > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-[#D9114A]'}`}>
                                          {formatBB(pNet, bb)}
                                      </span>
                                  )}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- TABLE COMPONENTS ---

function StreetHeader({ title, cards, color = "bg-white/40 border-white/50", textColor = "text-gray-400" }: any) {
    return (
        <div className={`flex items-center justify-between px-6 py-2.5 border-y backdrop-blur-sm ${color}`}>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColor}`}>{title}</span>
            {cards && cards.length > 0 && (
                <div className="flex gap-1.5 p-1 bg-white/50 rounded-xl border border-white shadow-sm scale-90 md:scale-100">
                    {cards.map((c: string, i: number) => <Card key={i} card={c} size="md" />)}
                </div>
            )}
        </div>
    );
}

function ActionTable({ actions, bb, heroName, roster, heroLabel, isShowdown }: any) {
    if (!actions || actions.length === 0) {
        if (isShowdown) return null;
        return <div className="px-6 py-4 text-xs italic text-gray-300 font-medium bg-white/30 text-center uppercase tracking-widest leading-loose">No actions (Checked through)</div>;
    }

    return (
        <div className="divide-y divide-white/50 bg-white/40">
            {actions.map((act: any, idx: number) => {
                const isHero = act.actor === heroName;
                const isFold = act.verb.includes("fold");
                const isShow = act.verb.includes("shows");
                
                const playerInfo = roster.find((r:any) => r.name === act.actor);
                const posLabel = isHero ? heroLabel : (playerInfo?.pos || "UNK");

                let showCards: string[] = [];
                if (isShow && act.raw) {
                    const match = act.raw.match(/\[([2-9TJQKA][shdc].*?)\]/);
                    if (match) showCards = match[1].split(" ");
                }

                // All-In Logic
                let finalVerb = act.verb;
                if ((act.raw && act.raw.toLowerCase().includes("all-in")) || act.amount >= playerInfo?.stack) {
                    finalVerb = "all-in";
                }

                return (
                    <div key={idx} className={`grid grid-cols-[80px_80px_1fr_minmax(80px,auto)] md:grid-cols-[120px_100px_1fr_140px] gap-x-3 px-4 md:px-6 py-3 items-center text-sm transition-colors hover:bg-white/60 ${isHero ? 'bg-blue-50/20' : ''} ${isFold ? 'opacity-30' : ''}`}>
                        
                        <div className="flex flex-col items-center justify-center overflow-hidden w-full">
                            <PositionBadge pos={posLabel} />
                            <span className={`text-[10px] font-black truncate w-full text-center mt-1.5 uppercase tracking-tighter ${isHero ? "text-blue-600" : "text-gray-400 font-bold"}`}>
                                {act.actor}
                            </span>
                        </div>

                        <div className="flex justify-center md:justify-start">
                            <ActionBadge verb={finalVerb} />
                        </div>

                        <div className="flex justify-start overflow-x-auto hide-scrollbar">
                            {showCards.length > 0 && (
                                <div className="flex gap-2 p-1.5 bg-white/50 rounded-xl border border-white shadow-sm scale-90 md:scale-100">
                                    {showCards.map((c, i) => <Card key={i} card={c} size="sm" />)}
                                </div>
                            )}
                        </div>

                        <div className="text-right flex flex-col items-end">
                            {act.amount > 0 && (
                                <>
                                    <span className={`font-mono font-black text-sm md:text-base tracking-tighter ${isHero ? "text-blue-700" : "text-gray-800"}`}>
                                        {formatNumber(act.amount)}
                                    </span>
                                    {bb > 0 && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-gray-100/50 text-gray-400 mt-1 uppercase tracking-tighter whitespace-nowrap`}>
                                            {formatBB(act.amount, bb)}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    )
}