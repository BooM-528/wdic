"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGuestId } from "@/lib/guest.client";
import { getHandDetail, analyzeHand } from "@/lib/wdic/api.client";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AiLanguageSwitcher from "@/components/AiLanguageSwitcher";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { getUserInfo, isLoggedIn, logout, UserInfo, setUserInfo } from "@/lib/auth.client";
import { apiFetch } from "@/lib/fetcher.client";

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

    const POSITIONS_MAP: Record<number, string[]> = {
        2: ["BTN/SB", "BB"],
        3: ["BTN", "SB", "BB"],
        4: ["BTN", "SB", "BB", "CO"],
        5: ["BTN", "SB", "BB", "UTG", "CO"],
        6: ["BTN", "SB", "BB", "UTG", "MP", "CO"],
        7: ["BTN", "SB", "BB", "UTG", "MP", "HJ", "CO"],
        8: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"],
        9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "MP", "HJ", "CO"],
        10: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "UTG+3", "MP", "HJ", "CO"],
    };

    return sortedPlayers.map((p, idx) => {
        let pos = "UNK";
        if (btnIndex !== -1) {
            const rel = (idx - btnIndex + count) % count;

            if (POSITIONS_MAP[count]) {
                pos = POSITIONS_MAP[count][rel];
            } else if (count > 10) {
                const map = [...POSITIONS_MAP[10]];
                while (map.length < count) {
                    map.splice(3, 0, `UTG+${map.length - 6}`);
                }
                pos = map[rel];
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
        "BTN/SB": "bg-emerald-50 text-emerald-600 border-emerald-200/50",
        CO: "bg-teal-50 text-teal-600 border-teal-200/50",
        HJ: "bg-amber-50 text-amber-600 border-amber-200/50",
        MP: "bg-orange-50 text-orange-600 border-orange-200/50",
        "UTG+2": "bg-rose-50 text-rose-600 border-rose-200/50",
        "UTG+1": "bg-rose-50 text-rose-600 border-rose-200/50",
        UTG: "bg-red-50 text-red-600 border-red-200/50",
        SB: "bg-indigo-50 text-indigo-600 border-indigo-200/50",
        BB: "bg-indigo-100/50 text-indigo-700 border-indigo-300/50",
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
    let iconColor = "";

    switch (suit) {
        case 'h': color = "text-rose-600"; iconColor = "text-rose-500"; icon = "♥"; break;
        case 'd': color = "text-blue-600"; iconColor = "text-blue-500"; icon = "♦"; break;
        case 'c': color = "text-emerald-600"; iconColor = "text-emerald-500"; icon = "♣"; break;
        case 's': color = "text-gray-900"; iconColor = "text-gray-700"; icon = "♠"; break;
    }

    const sizeClasses = {
        lg: "w-12 h-16 md:w-14 md:h-20 text-lg md:text-2xl rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        md: "w-10 h-14 md:w-10 md:h-14 text-sm md:text-base rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] font-black",
        sm: "w-9 h-12 md:w-10 md:h-14 text-xs md:text-sm rounded-lg border shadow-[0_2px_6px_rgba(0,0,0,0.05)] font-black"
    };

    return (
        <div className={`${sizeClasses[size]} flex flex-col items-center justify-center bg-white border border-gray-100 select-none group-hover:shadow-md transition-all duration-300 relative overflow-hidden`}>
            {/* Subtle Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
                <span className={`font-black leading-none ${color} tracking-tighter`}>{rank}</span>
                <span className={`leading-none ${iconColor} mt-0.5 opacity-90 text-[1.2em]`}>{icon}</span>
            </div>
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
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1a365d] to-[#0f172a] border border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden relative`}>
            {/* Geometric Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-1/2 h-1/2 border-2 border-white rotate-45"></div>
            </div>
            {/* Center Logo/Icon placeholder */}
            <div className="relative z-10 w-4 h-4 rounded-full border border-white/30 flex items-center justify-center bg-white/5">
                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
            </div>
        </div>
    );
}

function BoardDisplay({ cards, size = "md" }: { cards: string[], size?: "sm" | "md" | "lg" }) {
    const { t } = useLanguage();
    const unique = getUniqueBoard(cards);
    if (unique.length === 0) return <div className="text-gray-400 text-xs italic">{t("no_board")}</div>;
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
            "bottom-[-5px] left-1/2 -translate-x-1/2",  // Pos 0 (Hero)
            "bottom-[28%] left-[-25px]",                // Pos 1
            "top-[28%] left-[-25px]",                   // Pos 2
            "top-[-10px] left-1/2 -translate-x-1/2",    // Pos 3
            "top-[28%] right-[-25px]",                  // Pos 4
            "bottom-[28%] right-[-25px]",               // Pos 5
        ];
    } else {
        seatPositions = [
            "bottom-[-10px] left-1/2 -translate-x-1/2", // Pos 0 (Hero)
            "bottom-[18%] left-[-30px]",                // Pos 1
            "top-1/2 left-[-40px] -translate-y-1/2",    // Pos 2 (Middle Left)
            "top-[18%] left-[-30px]",                   // Pos 3
            "top-[-15px] left-[20%] -translate-x-1/2",  // Pos 4
            "top-[-15px] right-[20%] translate-x-1/2",  // Pos 5
            "top-[18%] right-[-30px]",                  // Pos 6
            "top-1/2 right-[-40px] -translate-y-1/2",   // Pos 7 (Middle Right)
            "bottom-[18%] right-[-30px]",               // Pos 8
        ];
    }

    return (
        <div className="relative mx-auto bg-transparent my-4 md:my-8 select-none origin-center 
        w-[360px] h-[540px] scale-[0.75] sm:scale-90 md:scale-100">

            {/* Table Felt */}
            <div className="absolute inset-4 bg-[#35654d] border-[8px] border-[#2c3e50] shadow-2xl flex flex-col items-center justify-center 
        rounded-[150px]">

                {/* Center Info */}
                <div className="z-10 flex flex-col items-center gap-3">
                    <div className="bg-black/40 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
                        Pot: {formatNumber(pot)}
                        <span className="text-[9px] opacity-70 ml-1 font-normal">({formatBB(pot, bb)})</span>
                    </div>
                    <div className="flex gap-1.5 shadow-2xl scale-75 md:scale-90">
                        {board.map((c: string, i: number) => <Card key={i} card={c} size="md" />)}
                        {board.length === 0 && <div className="h-14 w-32 flex items-center justify-center text-white/20 text-xs font-bold border-2 border-dashed border-white/10 rounded-lg text-center px-4">Wait for Flop</div>}
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
                    <div key={player.seat} className={`absolute ${posClass} flex flex-col items-center transition-all duration-500 ${isWinner ? 'z-[60]' : isHero ? 'z-[50]' : 'z-30'} w-[85px] md:w-[100px]`}>

                        {/* WIN Bubble: Higher up */}
                        {isWinner && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white whitespace-nowrap z-[100]">
                                WIN!
                            </div>
                        )}

                        {/* Cards Layer: Scale adjusted for density */}
                        <div className="relative z-20 mb-2 flex justify-center h-12 scale-90">
                            {myCards ? (
                                <div className="flex gap-1 items-end hover:scale-110 transition-transform duration-300 drop-shadow-xl">
                                    <Card card={myCards[0]} size="sm" />
                                    <Card card={myCards[1]} size="sm" />
                                </div>
                            ) : (
                                <div className="flex gap-1 items-end opacity-80">
                                    <CardBack size="sm" />
                                    <CardBack size="sm" />
                                </div>
                            )}
                        </div>

                        {/* Info Panel: Increased pt for the absolute badge */}
                        <div className={`relative flex flex-col items-center text-center rounded-lg px-2 py-1 pt-4 border shadow-md w-full z-30 backdrop-blur-sm
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


// --- 4. Combined Player List (Roster + Performance) ---
function CombinedPlayerList({ roster, playerStats, bb, heroName }: any) {
    const { t } = useLanguage();
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white shadow-sm overflow-hidden mb-6">
            <div className="bg-white/40 px-6 py-3 border-b border-white/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t("table_roster")} & {t("performance")}</span>
            </div>
            <div className="divide-y divide-white/50">
                {roster.map((p: any) => {
                    const isHero = p.name === heroName;
                    const stat = playerStats[p.name] || { invested: 0, net: 0 };
                    const pNet = stat.net;

                    return (
                        <div key={p.seat} className={`flex justify-between items-center px-5 py-3 transition-colors hover:bg-white/40 ${isHero ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    <PositionBadge pos={p.pos} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[13px] font-black truncate ${isHero ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</span>
                                    <span className="text-[10px] font-mono text-gray-400 font-bold">{formatNumber(p.stack)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end text-right flex-shrink-0">
                                <span className={`text-xs font-black tracking-tight ${pNet > 0 ? 'text-green-600' : pNet < 0 ? 'text-[#D9114A]' : 'text-gray-400'}`}>
                                    {pNet > 0 ? "+" : ""}{formatNumber(pNet)}
                                </span>
                                {bb > 0 && pNet !== 0 && (
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mt-0.5 ${pNet > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-[#D9114A]'}`}>
                                        {formatBB(pNet, bb)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- 5. Main Page ---

export default function HandDetailPage() {
    const { t, language, aiLanguage } = useLanguage();
    const params = useParams<{ id: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
    const [user, setUser] = useState<(UserInfo & { usage: any }) | null>(null);

    const refreshUser = useCallback(async () => {
        try {
            const me = await apiFetch<any>("/accounts/me");
            setUser(me);
            if (isLoggedIn()) {
                setUserInfo(me); // Only sync to localStorage if actually logged in
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
            if (isLoggedIn()) {
                setUser(getUserInfo() as any);
            }
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const handleLogout = () => {
        logout();
        window.location.href = "/";
    };

    const handleAnalyze = async (force = false) => {
        if (!data?.id || analyzing) return;
        setAnalyzing(true);
        try {
            const result = await analyzeHand(data.id, force, aiLanguage);
            setData({ ...data, analysis: result });
            refreshUser();
        } catch (e) {
            console.error("AI Analysis failed", e);
        } finally {
            setAnalyzing(false);
        }
    };

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
        const heroP = roster.find((p: any) => p.name === "Hero");
        return heroP ? heroP.pos : "UNK";
    }, [roster]);

    const playerStats = useMemo(() => {
        if (!data) return {};
        return calculateAllPlayersNet(roster, data.actions_json?.actions || [], data.actions_json?.winners || []);
    }, [data, roster]);

    if (loading || !data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-[#D9114A] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-rose-100/50 animate-ping"></div>
            </div>
            <span className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
                {t("loading_hand_data")}
            </span>
        </div>
    );

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

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-10 pt-24 md:pt-10">

                {/* Navigation */}
                <div className="relative flex items-center justify-between mb-8 md:mb-12">
                    <div className="flex items-center gap-6">
                        <Link href={`/wdic/sessions/${session_id}`} className="inline-flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:border-gray-400 transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </div>
                            <span className="text-sm font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-widest">{t("back_to_session")}</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <img src="/logo.png" alt="WDIC Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">{t("brand_name")}</span>
                    </div>

                    <div className="flex items-center gap-6">
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
                                    <span className="text-[8px] font-bold text-[#D9114A] leading-none uppercase tracking-[.2em]">{user.tier}</span>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="ml-2 p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                                    title="Logout"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                </button>
                            </div>
                        )}
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className="space-y-8">

                    {/* 1. Header Layout (Premium Glassmorphism) */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-12 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden mb-8 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="relative z-10 flex flex-col justify-center">
                            {/* Hand Info */}
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-[10px] text-[#D9114A] font-black uppercase tracking-widest bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100/50 shadow-sm backdrop-blur-sm">
                                    {t("hand_no")} #{hand_no}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    {formatDate(started_at)}
                                </span>
                            </div>

                            <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-10">

                                {/* Left: Cards Group */}
                                <div className="order-2 lg:order-1 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                                    {/* Hero Hand */}
                                    <div className="text-center group/cards">
                                        <div className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-[0.2em] flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                            {t("hero")} <PositionBadge pos={heroPos} />
                                    </div>
                                    <div className="flex gap-2 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 backdrop-blur-sm group-hover/cards:scale-105 transition-transform">
                                        {hero_cards_str?.split(" ").map((c: string, i: number) => <Card key={i} card={c} size="lg" />)}
                                    </div>
                                </div>

                                {/* Board */}
                                {fullBoard.length > 0 && (
                                    <div className="text-center group/board">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">{t("board")}</div>
                                        <div className="flex gap-1.5 p-3 bg-white/50 rounded-2xl border border-white shadow-sm group-hover/board:scale-105 transition-transform">
                                            <BoardDisplay cards={fullBoard} size="lg" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Result Group (Restored) */}
                            <div className="order-1 lg:order-2 flex flex-col items-center lg:items-end w-full lg:w-auto">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 border shadow-sm ${isWin ? 'bg-green-50 text-green-700 border-green-100' : net < 0 ? 'bg-rose-50 text-[#D9114A] border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    {isSplitPot ? t("split_pot") : isWin ? t("you_won") : t("you_lost")}
                                </span>

                                <div className="flex flex-col items-center lg:items-end">
                                    <h1 className={`text-4xl md:text-6xl font-black tracking-tighter leading-none drop-shadow-sm ${net >= 0 ? 'text-green-600' : 'text-[#D9114A]'}`}>
                                        {net > 0 ? "+" : ""}{formatNumber(net)}
                                    </h1>
                                    {bb > 0 && (
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black mt-2 shadow-sm ${net >= 0 ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-[#D9114A]'}`}>
                                            {(net / bb).toFixed(1)} BB
                                        </span>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                        </div>


                    <div className="flex flex-col gap-8">

                        {/* 1. AI Analysis Section (Full Width, Top) */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-rose-50/50 blur-3xl -translate-y-32 translate-x-32 pointer-events-none opacity-50"></div>

                            <div className="bg-gradient-to-r from-[#D9114A]/5 to-blue-50/50 px-8 py-7 border-b border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D9114A] to-rose-400 flex items-center justify-center text-white shadow-[0_10px_25px_rgba(217,17,74,0.25)] rotate-3">
                                        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-1">{t("ai_insights")}</h2>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{t("ai_insights_desc")}</p>
                                            <AiLanguageSwitcher />
                                            {user && (
                                                <span className="text-[9px] font-black text-[#D9114A] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 uppercase tracking-tighter">
                                                    {user.usage.hand_limit - user.usage.hand_count} {t("remaining")} 
                                                    {user.usage.extra_hand_balance > 0 ? ` (+${user.usage.extra_hand_balance} ${t("extra")})` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    {data.analysis && isAnalysisCollapsed && <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{t("analysis_complete")}</div>}
                                    {data.analysis && (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button onClick={() => handleAnalyze(true)} disabled={analyzing} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 group ${analyzing ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900 active:scale-95 shadow-sm'}`}>
                                                {analyzing ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> : <svg className="group-hover:rotate-180 transition-transform duration-500" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>}
                                                {analyzing ? t("updating") : t("re_analyze")}
                                            </button>
                                            <button
                                                onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
                                                className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 shadow-sm
                                    ${isAnalysisCollapsed ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'}`}
                                            >
                                                <svg className={`w-3 h-3 transition-transform duration-300 ${isAnalysisCollapsed ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                                {isAnalysisCollapsed ? t("show_analysis") : t("hide_analysis")}
                                            </button>
                                        </div>
                                    )}

                                    {!data.analysis && (
                                        <button onClick={() => handleAnalyze(false)} disabled={analyzing} className={`w-full md:w-auto group/btn relative px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden ${analyzing ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-gray-900 text-white hover:bg-[#D9114A] active:scale-95'}`}>
                                            {!analyzing && <div className="absolute inset-0 bg-gradient-to-r from-[#D9114A] via-[#FF4D80] to-[#D9114A] opacity-10 group-hover/btn:opacity-100 transition-opacity duration-500 bg-[length:200%_100%] animate-gradient-x"></div>}
                                            <div className="relative z-10 flex items-center justify-center gap-3">
                                                {analyzing ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> {t("loading")}</> : <><span className="drop-shadow-sm">{t("get_ai_insights")}</span><svg className="group-hover/btn:scale-125 group-hover/btn:rotate-12 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg></>}
                                            </div>
                                        </button>
                                    )}


                                </div>
                            </div>

                            <AnimatePresence>
                                {data.analysis && !isAnalysisCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 md:p-12 border-t border-white/50">
                                            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                                                <div className="relative w-32 h-32 flex-shrink-0 mx-auto md:mx-0">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                                                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={264} strokeDashoffset={264 - (264 * (data.analysis.score || 0)) / 100} className={`${(data.analysis.score || 0) >= 80 ? "text-green-500" : (data.analysis.score || 0) >= 50 ? "text-blue-500" : "text-[#D9114A]"} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-3xl font-black text-gray-900 tracking-tighter">{data.analysis.score || 0}</span>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t("score")}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${data.analysis.suggestion === 'GOOD_PLAY' ? 'bg-green-50 text-green-700 border-green-100' : data.analysis.suggestion === 'BLUNDER' ? 'bg-rose-50 text-[#D9114A] border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{data.analysis.suggestion?.replace('_', ' ')}</div>
                                                        <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
                                                    </div>
                                                    {data.analysis.key_mistakes && data.analysis.key_mistakes.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {data.analysis.key_mistakes.map((m: string, i: number) => (
                                                                <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-gray-100 shadow-sm flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#D9114A]"></span>{m}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed bg-white/40 p-8 md:p-12 rounded-[2.5rem] border border-white transition-all duration-700">
                                                <ReactMarkdown components={{ h1: ({ node, ref, ...props }: any) => <h1 className="text-2xl font-black text-gray-900 mb-6 mt-8 first:mt-0 tracking-tight" {...props} />, h2: ({ node, ref, ...props }: any) => <h2 className="text-xl font-black text-gray-900 mb-4 mt-8 first:mt-0 tracking-tight" {...props} />, h3: ({ node, ref, ...props }: any) => <h3 className="text-lg font-black text-gray-900 mb-3 mt-6 first:mt-0 tracking-tight" {...props} />, p: ({ node, ref, ...props }: any) => <p className="mb-4 last:mb-0" {...props} />, ul: ({ node, ref, ...props }: any) => <ul className="list-none space-y-3 mb-6" {...props} />, li: ({ node, ref, ...props }: any) => (<li className="flex gap-3 items-start group/li" {...props}> <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D9114A] flex-shrink-0 group-hover/li:scale-125 transition-transform"></span> <span>{props.children}</span> </li>), strong: ({ node, ref, ...props }: any) => <strong className="font-black text-gray-900" {...props} />, blockquote: ({ node, ref, ...props }: any) => <blockquote className="border-l-4 border-[#D9114A] pl-6 py-2 my-6 italic text-gray-600 bg-rose-50/30 rounded-r-2xl" {...props} />, }}>{data.analysis.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!data.analysis && (
                                <div className="p-20 text-center">
                                    <div className="inline-flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex items-center justify-center text-gray-300 rotate-6">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-gray-600 uppercase tracking-widest">{t("no_analysis_title")}</p>
                                            <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed mx-auto uppercase font-bold tracking-tighter opacity-60">{t("no_analysis_desc")}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-8 items-start">
                            {/* Left Column: Poker Table & Player Roster */}
                            <div className="space-y-8">
                                {/* 2. Poker Table Visualization */}
                                <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden py-12 flex items-center justify-center">
                                    <div className="w-full max-w-4xl px-4">
                                        <PokerTable roster={roster} heroName="Hero" board={fullBoard} pot={totalPot} winners={winners} bb={bb} shownCards={shownCards} />
                                    </div>
                                </div>

                                {/* 3. Combined Player List */}
                                <CombinedPlayerList roster={roster} playerStats={playerStats} bb={bb} heroName="Hero" />
                            </div>

                            {/* Right Column: Action Timeline */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
                                {/* Setup */}
                                {sections.SETUP.length > 0 && (
                                    <div className="bg-gray-50/50 border-b border-white px-6 py-3 text-[10px] text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
                                        <span className="font-black uppercase tracking-[0.2em] text-gray-400">{t("setup_actions")}</span>
                                        {sections.SETUP.map((act: any, i: number) => (
                                            <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                                <b className={`font-black uppercase ${act.actor === "Hero" ? "text-blue-500" : "text-gray-500"}`}>{act.actor === "Hero" ? "Hero" : roster.find((r: any) => r.name === act.actor)?.pos}</b>
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
    const { t } = useLanguage();
    if (!actions || actions.length === 0) {
        if (isShowdown) return null;
        return <div className="px-6 py-4 text-xs italic text-gray-300 font-medium bg-white/30 text-center uppercase tracking-widest leading-loose">{t("no_actions")}</div>;
    }

    return (
        <div className="divide-y divide-white/50 bg-white/40">
            {actions.map((act: any, idx: number) => {
                const isHero = act.actor === heroName;
                const isFold = act.verb.includes("fold");
                const isShow = act.verb.includes("shows");

                const playerInfo = roster.find((r: any) => r.name === act.actor);
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
                    <div key={idx} className={`grid grid-cols-[80px_80px_1fr_minmax(80px,auto)] md:grid-cols-[120px_100px_1fr_minmax(120px,auto)] gap-x-3 px-4 md:px-6 py-3 items-center text-sm transition-colors hover:bg-white/60 ${isHero ? 'bg-blue-50/20' : ''} ${isFold ? 'opacity-30' : ''}`}>

                        <div className="flex flex-col items-center justify-center overflow-hidden w-full">
                            <PositionBadge pos={posLabel} />
                            <span className={`text-[10px] font-black truncate w-full text-center mt-1.5 uppercase tracking-tighter ${isHero ? "text-blue-600" : "text-gray-400 font-bold"}`}>
                                {act.actor}
                            </span>
                        </div>

                        <div className="flex justify-center md:justify-start">
                            <ActionBadge verb={finalVerb} />
                        </div>

                        <div className="flex justify-start">
                            {showCards.length > 0 && (
                                <div className="flex gap-2 p-1.5 bg-white/50 rounded-xl border border-white shadow-sm">
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