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

export type WdicHandAnalysis = {
  id: string;
  hand_id: string;
  content: string;
  suggestion: string | null;
  score: number;
  key_mistakes: string[];
  model_name: string;
  prompt_version: string;
  tokens_used: number;
  created_at: string;
};

export type WdicHandDetail = {
  id: string;
  session_id: string;
  hand_no: string | null;
  source: string;
  started_at: string | null;
  raw_text: string;
  actions_json: any | null;
  max_players: number;
  hero_seat: number | null;
  button_seat: number | null;
  hero_position: string | null;
  hero_cards_str: string | null;
  hero_collected: number;
  hero_invested: number;
  ante: number;
  bb_value: number;
  board_cards_str: string | null;
  parsed_version: string;
  created_at: string;
  analysis: WdicHandAnalysis | null;
};
