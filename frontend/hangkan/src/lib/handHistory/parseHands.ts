export type ParsedHand = {
  index: number;
  handId?: string;
  startedAt?: string;
  rawText: string;
};

const HEADER_RE = /^(Poker Hand #|Hand #|Game Hand #)/;

export function parseHands(input: string): ParsedHand[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  const hands: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) hands.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (HEADER_RE.test(line) && buf.length > 0) {
      flush();
    }
    buf.push(line);
  }
  flush();

  return hands.map((rawText, i) => {
    // ดึง handId แบบหยาบๆ ก่อน (ค่อยเพิ่มให้แม่นทีหลัง)
    const firstLine = rawText.split("\n")[0] ?? "";
    const handIdMatch =
      firstLine.match(/Poker Hand #([A-Za-z0-9]+)/) ||
      firstLine.match(/Hand #([A-Za-z0-9]+)/);

    // ดึง timestamp ถ้ามีรูปแบบ YYYY/MM/DD HH:MM:SS
    const tsMatch = firstLine.match(/\b(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\b/);

    return {
      index: i + 1,
      handId: handIdMatch?.[1],
      startedAt: tsMatch?.[1],
      rawText,
    };
  });
}
