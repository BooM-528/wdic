export interface GiftEvent {
  id: number;
  share_code: string;
  name: string;
  description: string;
  image: string | null;
  created_at: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface Participant {
  id: number;
  display_name: string;
  avatar: string | null;
  user: number | null;
  joined_at: string;
}

export interface DrawPerson {
  id: number;
  display_name: string;
  avatar: string | null;
}

export interface DrawResult {
  id: number;
  mode: string;
  giver: DrawPerson;
  receiver: DrawPerson;
  is_confirmed: boolean;
  drawn_at: string;
  confirmed_at: string | null;
}

export interface EventParticipantsResponse {
  event: GiftEvent;
  participants: Participant[];
  confirmed_draws: DrawResult[];
  pending_draws: DrawResult[];
  remaining: {
    givers: Participant[];
    receivers: Participant[];
  };
}
