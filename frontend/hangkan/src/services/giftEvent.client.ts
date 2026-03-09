import { apiFetch } from '@/lib/fetcher.client';
import type { EventParticipantsResponse } from '@/types/giftEvent';

/* =========================
   Event
========================= */

// สร้าง event
export function createGiftEvent(payload: {
  name: string;
  description?: string;
  image?: string | null;
}) {
  return apiFetch<{
    id: number;
    share_code: string;
    name: string;
    description: string;
    image: string | null;
  }>('/giftings/events/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* =========================
   Participants
========================= */

// ดึง event + ผู้เข้าร่วม
export function getEventParticipants(shareCode: string) {
  return apiFetch<EventParticipantsResponse>(
    `/giftings/events/participants/${shareCode}/`
  );
}

// เข้าร่วม event
export async function joinEventParticipant(
  shareCode: string,
  payload: {
    display_name: string;
    avatar?: File | null;
  }
) {
  const formData = new FormData();
  formData.append('display_name', payload.display_name);

  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  }

  const res = await apiFetch(
    `/giftings/events/participants/${shareCode}/`,
    {
      method: 'POST',
      body: formData,
      skipJson: true,

    }
  );
  return res;
}


/* =========================
   Draw
========================= */

// สุ่ม 1 ครั้ง
export function drawOne(
  shareCode: string,
  payload: {
    mode: 'random' | 'chain';
  }
) {
  return apiFetch(
    `/giftings/events/draw/one/${shareCode}/`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// ยืนยันผล
export function confirmDraw(
  shareCode: string,
  drawId: number
) {
  return apiFetch(
    `/giftings/events/draw/confirm/${shareCode}/${drawId}/`,
    {
      method: 'POST',
    }
  );
}

