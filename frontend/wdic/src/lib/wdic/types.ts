export type WdicSession = {
  id: string;
  name: string | null;
  source: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  handCount: number;
};

export type WdicHandListItem = {
  id: string;
  hand_no: string | null;
  source: string;
  started_at: string | null;
  created_at: string;
};

export type WdicSessionHandsResponse = {
  session: WdicSession;
  hands: WdicHandListItem[];
};

export type WdicHandDetail = {
  id: string;
  session_id: string;
  hand_no: string | null;
  source: string;
  started_at: string | null;
  raw_text: string;
  actions_json: Array<{
    street: string;
    lineNo: number;
    actor?: string;
    verb: string;
    amount?: number | null;
    raw: string;
  }> | null;
  parsed_version: string;
  created_at: string;
};
