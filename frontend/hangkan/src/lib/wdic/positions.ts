type PosMap = Record<string, string>;

const POS_9 = ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "LJ", "HJ", "CO"];
const POS_8 = ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"];
const POS_6 = ["BTN", "SB", "BB", "UTG", "MP", "CO"];

function getPosNames(n: number) {
  if (n <= 2) return ["BTN/SB", "BB"];
  if (n <= 6) return POS_6.slice(0, n);
  if (n === 8) return POS_8;
  if (n >= 9) return POS_9.slice(0, Math.min(n, 9));
  return POS_8.slice(0, n);
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
