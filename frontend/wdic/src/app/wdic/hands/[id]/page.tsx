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

function Card({ card, size = "md" }: { card: string; size?: "sm" | "md" | "lg" }) {
  if (!card) return null;
  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toLowerCase();
  
  let color = "text-gray-800";
  let icon = "";
  switch (suit) {
    case 'h': color = "text-red-600"; icon = "♥"; break;
    case 'd': color = "text-blue-600"; icon = "♦"; break;
    case 'c': color = "text-green-600"; icon = "♣"; break;
    case 's': color = "text-black"; icon = "♠"; break;
  }

  const sizeClasses = {
      lg: "w-12 h-16 md:w-14 md:h-20 text-lg md:text-2xl rounded-md md:rounded-lg shadow-md",
      md: "w-10 h-14 md:w-10 md:h-14 text-sm md:text-base rounded shadow-sm",
      sm: "w-9 h-12 md:w-10 md:h-14 text-xs md:text-sm rounded-sm border shadow-sm"
  };

  return (
    <div className={`${sizeClasses[size]} flex flex-col items-center justify-center bg-white border border-gray-300 select-none`}>
      <span className={`font-bold leading-none ${color}`}>{rank}</span>
      <span className={`leading-none ${color} mt-0.5`}>{icon}</span>
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
  let style = "bg-gray-100 text-gray-500 border-gray-200";
  
  if (v.includes("all-in")) {
      style = "bg-red-600 text-white border-red-700 font-black shadow-sm ring-1 ring-red-500/50";
  }
  else if (v.includes("fold")) style = "bg-gray-50 text-gray-400 border-gray-100 line-through decoration-gray-300";
  else if (v.includes("check")) style = "bg-gray-100 text-gray-600 border-gray-200";
  else if (v.includes("call")) style = "bg-blue-50 text-blue-700 border-blue-200";
  else if (v.includes("bet")) style = "bg-orange-50 text-orange-700 border-orange-200";
  else if (v.includes("raise")) style = "bg-red-50 text-red-700 border-red-200 font-bold";
  else if (v.includes("return")) style = "bg-green-50 text-green-700 border-green-200";
  else if (v.includes("show")) style = "bg-purple-50 text-purple-700 border-purple-200 font-bold";
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${style} block w-fit`}>
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
    <div className="relative mx-auto bg-transparent my-24 md:my-28 select-none origin-center 
        w-[340px] h-[580px] md:w-[700px] md:h-[350px] scale-[0.9] sm:scale-100 md:scale-100">
      
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
          <div key={player.seat} className={`absolute ${posClass} flex flex-col items-center transition-all duration-500 z-30 w-[110px]`}>
            
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
    <div className="min-h-screen bg-[#F2F4F7] pb-20 font-sans text-gray-900">
      
      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <Link href={`/wdic/sessions/${session_id}`} className="text-gray-500 hover:text-gray-900 text-xs font-bold uppercase tracking-widest transition-colors">
           ← Back
        </Link>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400">#{hand_no}</span>
            <span className="text-[10px] font-bold text-gray-300">{formatDate(started_at)}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* 1. Header Layout */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Left: Cards Group */}
                <div className="order-2 md:order-1 flex items-center gap-4 md:gap-8">
                     {/* Hero Hand */}
                     <div className="text-center">
                         <div className="text-[9px] font-bold text-blue-500 uppercase mb-2 flex items-center justify-center gap-1">
                             Hero <PositionBadge pos={heroPos} />
                         </div>
                         <div className="flex gap-1.5">
                             {hero_cards_str?.split(" ").map((c:string, i:number) => <Card key={i} card={c} size="lg" />)}
                         </div>
                     </div>

                     {/* Board */}
                     {fullBoard.length > 0 && (
                         <div className="text-center">
                             <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Board</div>
                             <BoardDisplay cards={fullBoard} size="lg" />
                         </div>
                     )}
                </div>

                {/* Right: Result Group */}
                <div className="order-1 md:order-2 flex flex-col items-center md:items-end w-full md:w-auto">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-2 ${isWin ? 'bg-green-100 text-green-700' : net < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isSplitPot ? "Split Pot" : isWin ? "You Won" : "You Lost"}
                    </span>
                    
                    <div className="flex flex-col items-center md:items-end">
                        <h1 className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {net > 0 ? "+" : ""}{formatNumber(net)}
                        </h1>
                        {bb > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold mt-1 ${net >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {(net/bb).toFixed(1)} BB
                            </span>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* 2. POKER TABLE VISUALIZATION */}
        <PokerTable 
            roster={roster} 
            heroName="Hero" 
            board={fullBoard} 
            pot={totalPot}
            winners={winners}
            bb={bb}
            shownCards={shownCards} 
        />

        {/* 3. TABLE ROSTER (Players List) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Players</span>
                <span className="text-[10px] font-bold text-gray-400">Blinds: {formatNumber(actions_json?.blinds?.sb)}/{formatNumber(bb)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100">
                {roster.map((p: any) => {
                    const isHero = p.name === "Hero";
                    return (
                        <div key={p.seat} className={`p-3 text-center flex flex-col items-center justify-center ${isHero ? 'bg-blue-50/40' : ''}`}>
                            <div className="mb-1">
                                <PositionBadge pos={p.pos} />
                            </div>
                            <div className={`text-xs font-bold truncate max-w-[100px] ${isHero ? 'text-blue-700' : 'text-gray-700'}`}>{p.name}</div>
                            <div className="text-xs font-mono text-gray-500">{formatNumber(p.stack)}</div>
                            <div className="text-[9px] font-bold text-gray-300">{formatBB(p.stack, bb)}</div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* 4. THE HAND TABLE (Action Grid) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Setup */}
            {sections.SETUP.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-[10px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-bold uppercase text-gray-400 tracking-wider mr-2">Setup:</span>
                    {sections.SETUP.map((act: any, i: number) => (
                        <span key={i}>
                            <b className={act.actor==="Hero"?"text-blue-600":""}>{act.actor==="Hero"?"Hero":roster.find((r:any)=>r.name===act.actor)?.pos}</b> {act.verb} {formatNumber(act.amount)}
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
                        <StreetHeader title="SHOWDOWN" color="bg-yellow-50 border-yellow-100" textColor="text-yellow-700" />
                        <ActionTable actions={sections.SHOWDOWN} bb={bb} heroName="Hero" roster={roster} heroLabel={heroLabel} isShowdown />
                    </>
                )}
            </div>
        </div>

        {/* 5. NET RESULT SUMMARY */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-900 px-4 py-2">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Hand Results</span>
            </div>
            <div className="divide-y divide-gray-100">
                {Object.entries(playerStats).map(([player, stat]: any) => {
                    if (stat.invested === 0 && stat.collected === 0) return null;
                    const isHero = player === "Hero";
                    const pInfo = roster.find((r:any)=>r.name===player);
                    const pNet = stat.net;

                    return (
                        <div key={player} className="flex justify-between items-center px-4 py-2 text-sm">
                            <div className="flex items-center gap-2 w-1/3">
                                <PositionBadge pos={pInfo?.pos} />
                                <span className={`font-bold ${isHero ? 'text-blue-600' : 'text-gray-700'}`}>{player}</span>
                            </div>
                            <div className="w-1/3 text-center text-xs text-gray-400">
                                {stat.invested > 0 && `Inv: ${formatNumber(stat.invested)}`}
                            </div>
                            <div className="w-1/3 text-right flex flex-col items-end">
                                <span className={`font-mono font-bold ${pNet > 0 ? 'text-green-600' : pNet < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {pNet > 0 ? "+" : ""}{formatNumber(pNet)}
                                </span>
                                {bb > 0 && pNet !== 0 && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${pNet > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
  );
}

// --- TABLE COMPONENTS ---

function StreetHeader({ title, cards, color = "bg-gray-100 border-gray-200", textColor = "text-gray-500" }: any) {
    return (
        <div className={`flex items-center justify-between px-4 py-2 border-y ${color}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{title}</span>
            {cards && cards.length > 0 && (
                <div className="flex gap-1">
                    {cards.map((c: string, i: number) => <Card key={i} card={c} size="md" />)}
                </div>
            )}
        </div>
    );
}

// ✅ ActionTable: ใช้ Margin/Padding ที่คุณถูกใจ (py-1.5)
function ActionTable({ actions, bb, heroName, roster, heroLabel, isShowdown }: any) {
    if (!actions || actions.length === 0) {
        if (isShowdown) return null;
        return <div className="px-4 py-2 text-xs italic text-gray-400 bg-white">No actions (Checked through)</div>;
    }

    return (
        <div className="divide-y divide-gray-100 bg-white">
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
                    <div key={idx} className={`grid grid-cols-[80px_80px_1fr_minmax(60px,auto)] md:grid-cols-[100px_100px_1fr_120px] gap-x-1 gap-y-0 px-3 md:px-4 py-1.5 items-center text-sm ${isHero ? 'bg-blue-50/20' : ''} ${isFold ? 'opacity-40' : ''}`}>
                        
                        <div className="flex flex-col items-center justify-center overflow-hidden w-full">
                            <PositionBadge pos={posLabel} />
                            <span className={`text-[9px] font-medium truncate w-full text-center mt-0.5 ${isHero ? "text-blue-600" : "text-gray-400"}`}>
                                {act.actor}
                            </span>
                        </div>

                        <div className="flex justify-center md:justify-start">
                            <ActionBadge verb={finalVerb} />
                        </div>

                        <div className="flex justify-start overflow-x-auto hide-scrollbar">
                            {showCards.length > 0 && (
                                <div className="flex gap-1.5">
                                    {showCards.map((c, i) => <Card key={i} card={c} size="sm" />)}
                                </div>
                            )}
                        </div>

                        <div className="text-right flex flex-col items-end">
                            {act.amount > 0 && (
                                <>
                                    <span className={`font-mono font-bold text-xs md:text-sm ${isHero ? "text-blue-700" : "text-gray-700"}`}>
                                        {formatNumber(act.amount)}
                                    </span>
                                    {bb > 0 && (
                                        <span className={`text-[8px] md:text-[9px] font-bold px-1 rounded bg-gray-100 text-gray-500 mt-0.5 whitespace-nowrap`}>
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