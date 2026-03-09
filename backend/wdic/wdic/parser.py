import hashlib
import re
from typing import Any, Dict, List, Optional, Tuple

# --- Regex Definitions ---
HEADER_RE = re.compile(r"^(Poker Hand #|Hand #|Game Hand #)([^:]+):", re.IGNORECASE)
HAND_ID_RE = re.compile(r"#([A-Za-z0-9]+):")
TS_RE = re.compile(r"\b(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\b")

TABLE_MAX_RE = re.compile(r"\b(\d+)-max\b", re.IGNORECASE)
BTN_SEAT_RE = re.compile(r"Seat #(\d+) is the button", re.IGNORECASE)
SEAT_OCCUPIED_RE = re.compile(r"^Seat (\d+):\s*(.+?)\s*\(([\d,]+) in chips\)", re.IGNORECASE)

# ✅ แก้ CARDS_RE ให้จับไพ่ใบเดียวได้แม่นยำขึ้น
CARDS_RE = re.compile(r"\[([2-9TJQKA][shdc](?:\s+[2-9TJQKA][shdc])*)\]")
DEALT_TO_RE = re.compile(r"^Dealt to ([^\[]+)\s*(\[.+\])?")

# Actions & Money
RAISE_TO_RE = re.compile(r"^([^:]+):\s+raises\s+([\d,]+)\s+to\s+([\d,]+)", re.IGNORECASE)
# ✅ เพิ่ม shows / mucks ใน Standard Action
STANDARD_ACTION_RE = re.compile(r"^([^:]+):\s+(folds|checks|calls|bets|all-?in|posts\s+[a-z]+\s+blind|posts\s+the\s+ante|shows|mucks)(?:\s+([\d,]+))?", re.IGNORECASE)
# ✅ เพิ่ม Regex จับไพ่ที่ Show
SHOWS_CARDS_RE = re.compile(r"^([^:]+):\s+shows\s+\[(.+)\]", re.IGNORECASE)

RETURNED_RE = re.compile(r"^Uncalled bet \(([\d,]+)\) returned to (.+)", re.IGNORECASE)
WIN_RE = re.compile(r"^(.+?)(?::)?\s+collected\s+([\d,]+)", re.IGNORECASE)
SUMMARY_POT_RE = re.compile(r"Total pot ([\d,]+).*?Rake ([\d,]+)", re.IGNORECASE)
LEVEL_RE = re.compile(r"Level\s*\d+\s*\(([\d,]+)/([\d,]+)(?:\s+Ante\s+([\d,]+))?\)", re.IGNORECASE)

STREET_MARKERS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"^\*\*\*\s*HOLE CARDS\s*\*\*\*", re.IGNORECASE), "PREFLOP"),
    (re.compile(r"^\*\*\*\s*FLOP\s*\*\*\*", re.IGNORECASE), "FLOP"),
    (re.compile(r"^\*\*\*\s*TURN\s*\*\*\*", re.IGNORECASE), "TURN"),
    (re.compile(r"^\*\*\*\s*RIVER\s*\*\*\*", re.IGNORECASE), "RIVER"),
    (re.compile(r"^\*\*\*\s*SHOW DOWN\s*\*\*\*", re.IGNORECASE), "SHOWDOWN"),
    (re.compile(r"^\*\*\*\s*SUMMARY\s*\*\*\*", re.IGNORECASE), "SUMMARY"),
]

# --- Helper Functions ---
def calculate_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def _parse_amount(s: str) -> int:
    if not s: return 0
    try:
        return int(s.replace(",", "").strip())
    except ValueError:
        return 0

def determine_position(hero_seat: int, btn_seat: int, occupied_seats: List[int]) -> str:
    if hero_seat is None or btn_seat is None or not occupied_seats:
        return "UNK"
    if hero_seat not in occupied_seats:
        return "OBS"

    sorted_seats = sorted(occupied_seats)
    try:
        btn_idx = sorted_seats.index(btn_seat)
        hero_idx = sorted_seats.index(hero_seat)
    except ValueError:
        return "UNK"

    num_players = len(sorted_seats)
    steps = (hero_idx - btn_idx) % num_players

    if num_players == 2:
        return "BTN/SB" if steps == 0 else "BB"
    if steps == 0: return "BTN"
    if steps == 1: return "SB"
    if steps == 2: return "BB"
    if steps == num_players - 1: return "CO"
    if steps == num_players - 2: return "HJ"
    if steps == num_players - 3: return "MP"
    
    return "UTG" + (f"+{steps-3}" if steps > 3 else "")

def split_hands(raw_file_text: str) -> List[str]:
    text = raw_file_text.replace("\r\n", "\n").strip("\n")
    if not text.strip(): return []
    lines = text.split("\n")
    hands, buf = [], []
    for line in lines:
        if HEADER_RE.match(line) and buf:
            hands.append("\n".join(buf).strip())
            buf = []
        buf.append(line)
    if buf: hands.append("\n".join(buf).strip())
    return hands

def parse_hand_meta(raw_hand_text: str) -> Dict[str, Any]:
    first_line = (raw_hand_text.split("\n")[0] if raw_hand_text else "").strip()
    hand_no = None
    m_id = HAND_ID_RE.search(first_line)
    if m_id: hand_no = m_id.group(1)
    
    started_at = None
    m_ts = TS_RE.search(first_line)
    if m_ts: started_at = m_ts.group(1)
    return {"hand_no": hand_no, "started_at_str": started_at}

# --- Main Parser ---
def parse_hand_detail(raw_hand_text: str) -> Dict[str, Any]:
    lines = raw_hand_text.replace("\r\n", "\n").split("\n")
    
    actions = []
    hero_cards = []
    board_cards = []
    winners = []
    occupied_seats = []
    
    blinds = {"sb": 0, "bb": 0, "ante": 0}
    max_players = 0
    button_seat = None
    hero_seat = None
    
    total_pot = 0
    rake = 0
    hero_collected = 0
    
    hero_total_invested = 0
    hero_street_invested = 0 
    
    current_street = "PREFLOP"

    for idx, line in enumerate(lines, start=1):
        s = line.strip()
        if not s: continue

        # 1. Header Information
        if idx < 25 and current_street != "SUMMARY":
            if "Level" in s:
                m_level = LEVEL_RE.search(s)
                if m_level:
                    blinds["sb"] = _parse_amount(m_level.group(1))
                    blinds["bb"] = _parse_amount(m_level.group(2))

            m_max = TABLE_MAX_RE.search(s)
            if m_max: max_players = int(m_max.group(1))

            m_btn = BTN_SEAT_RE.search(s)
            if m_btn: button_seat = int(m_btn.group(1))

            m_seat = SEAT_OCCUPIED_RE.search(s)
            if m_seat:
                seat_num = int(m_seat.group(1))
                player_name = m_seat.group(2).strip()
                occupied_seats.append(seat_num)
                if player_name.upper() == "HERO":
                    hero_seat = seat_num

        # 2. Street Change
        street_changed = False
        for marker, street_name in STREET_MARKERS:
            if marker.match(s):
                current_street = street_name
                
                # Logic เดิม: รีเซ็ตยอดลงทน (ยกเว้น Preflop)
                if street_name != "PREFLOP":
                    hero_street_invested = 0 
                
                street_changed = True
                
                # ✅ FIX: ใช้ findall จับไพ่ทุกชุดในบรรทัด (แก้ River หาย)
                cards_matches = CARDS_RE.findall(s) 
                if cards_matches:
                    if street_name == "FLOP":
                        # Flop: *** FLOP *** [Ah Kh Qd]
                        # เอาวงเล็บแรกเลย
                        board_cards.extend(cards_matches[0].split())
                        
                    elif street_name in ["TURN", "RIVER"]:
                        # Turn: *** TURN *** [Ah Kh Qd] [2s]
                        # River: *** RIVER *** [Ah Kh Qd 2s] [Tc]
                        # เอาวงเล็บสุดท้าย ([-1]) ซึ่งจะเป็นไพ่ใบใหม่เสมอ
                        if len(cards_matches) > 1:
                            new_card = cards_matches[-1].split()
                            board_cards.extend(new_card)
                break
        if street_changed: continue

        # 3. Actions
        if s.startswith("Dealt to"):
            m = DEALT_TO_RE.search(s)
            if m:
                player = m.group(1).strip()
                if (player.upper() == "HERO") and m.group(2):
                    hero_cards = m.group(2).replace("[", "").replace("]", "").split()
            continue

        # Uncalled Bet (Refund)
        m_ret = RETURNED_RE.search(s)
        if m_ret:
            amount = _parse_amount(m_ret.group(1))
            player = m_ret.group(2).strip()
            actions.append({"street": current_street, "actor": player, "verb": "return", "amount": amount, "raw": s})
            if player.upper() == "HERO":
                hero_total_invested -= amount
            continue

        # Raise To
        m_raise = RAISE_TO_RE.search(s)
        if m_raise:
            actor = m_raise.group(1).strip()
            amount_total_street = _parse_amount(m_raise.group(3))
            
            if actor.upper() == "HERO":
                amount_added = amount_total_street - hero_street_invested
                if amount_added > 0:
                    hero_total_invested += amount_added
                    hero_street_invested = amount_total_street

            actions.append({"street": current_street, "actor": actor, "verb": "raises", "amount": amount_total_street, "raw": s})
            continue

        # ✅ Check for "Shows" action specifically to capture cards
        m_shows = SHOWS_CARDS_RE.search(s)
        if m_shows:
            actor = m_shows.group(1).strip()
            # เราอาจจะเก็บไพ่ที่โชว์ไว้ใน field ใหม่ หรือใส่ใน raw action ก็ได้
            actions.append({"street": current_street, "actor": actor, "verb": "shows", "amount": 0, "raw": s})
            continue

        # Standard Actions (Fold, Call, Bet, Check, Muck)
        m_act = STANDARD_ACTION_RE.search(s)
        if m_act:
            actor = m_act.group(1).strip()
            raw_verb = m_act.group(2).lower()
            amount = _parse_amount(m_act.group(3))
            verb = "posts" if "posts" in raw_verb else raw_verb

            if "ante" in raw_verb and blinds["ante"] == 0:
                blinds["ante"] = amount

            if actor.upper() == "HERO":
                hero_total_invested += amount
                if "ante" not in raw_verb: 
                    hero_street_invested += amount

            actions.append({"street": current_street, "actor": actor, "verb": verb, "amount": amount, "raw": s})
            continue

        # Win / Collected
        m_win = WIN_RE.search(s)
        if m_win:
            actor = m_win.group(1).strip()
            amount = _parse_amount(m_win.group(2))
            winners.append({"player": actor, "amount": amount})
            if actor.upper() == "HERO":
                hero_collected += amount
            continue

        if current_street == "SUMMARY":
            m_sum = SUMMARY_POT_RE.search(s)
            if m_sum:
                total_pot = _parse_amount(m_sum.group(1))
                rake = _parse_amount(m_sum.group(2))

    if max_players == 0:
        max_players = len(occupied_seats) if occupied_seats else 6
    hero_position = determine_position(hero_seat, button_seat, occupied_seats)

    return {
        "max_players": max_players,
        "hero_seat": hero_seat,
        "button_seat": button_seat,
        "hero_position": hero_position,
        "hero_cards": hero_cards,
        "hero_collected": hero_collected,
        "hero_invested": hero_total_invested, 
        "blinds": blinds,
        "total_pot": total_pot,
        "rake": rake,
        "board_cards": board_cards,
        "actions": actions,
        "winners": winners,
    }