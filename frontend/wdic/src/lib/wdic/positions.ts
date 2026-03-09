type PosMap = Record<string, string>;

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

function getPosNames(n: number) {
  if (POSITIONS_MAP[n]) return POSITIONS_MAP[n];
  if (n <= 2) return POSITIONS_MAP[2];
  
  // fallback for large n
  const map = [...POSITIONS_MAP[10]];
  while (map.length < n) {
      map.splice(3, 0, `UTG+${map.length - 6}`);
  }
  return map;
}

export function buildPlayerPositionMap(rawText: string): PosMap {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");

  // Seat lines: Seat 1: playerName (123 in chips)
  const seatRe = /^Seat\s+(\d+):\s+(.+?)\s+\(/;
  const btnRe = /Seat\s+#(\d+)\s+is\s+the\s+button/i;

  const seatToPlayer = new Map<number, string>();
  let buttonSeat: number | null = null;

  for (const line of lines) {
    const bm = line.match(btnRe);
    if (bm) buttonSeat = Number(bm[1]);

    const sm = line.match(seatRe);
    if (sm) {
      const seatNo = Number(sm[1]);
      const player = sm[2].trim();
      seatToPlayer.set(seatNo, player);
    }
  }

  if (!seatToPlayer.size || !buttonSeat) return {};

  const seats = [...seatToPlayer.keys()].sort((a, b) => a - b);

  // rotate seats array so it starts at button seat (BTN)
  const startIdx = seats.indexOf(buttonSeat);
  if (startIdx === -1) return {};

  const rotated = [...seats.slice(startIdx), ...seats.slice(0, startIdx)];
  const posNames = getPosNames(rotated.length);

  const playerToPos: PosMap = {};
  for (let i = 0; i < rotated.length; i++) {
    const seat = rotated[i];
    const player = seatToPlayer.get(seat);
    if (!player) continue;
    playerToPos[player] = posNames[i] ?? `Seat${seat}`;
  }

  return playerToPos;
}
