import { apiFetch } from "@/lib/fetcher.client";
import type { WdicHandDetail, WdicSession, WdicSessionHandsResponse } from "./types";

export async function listSessions(limit = 50): Promise<WdicSession[]> {
  return apiFetch<WdicSession[]>(`/wdic/sessions?limit=${limit}`, { method: "GET" });
}

export async function getSessionHands(sessionId: string, limit = 200): Promise<WdicSessionHandsResponse> {
  return apiFetch<WdicSessionHandsResponse>(`/wdic/sessions/${sessionId}/hands?limit=${limit}`, { method: "GET" });
}

export async function getHandDetail(handId: string): Promise<WdicHandDetail> {
  return apiFetch<WdicHandDetail>(`/wdic/hands/${handId}`, { method: "GET" });
}

export async function importSession(payload: { rawFileText: string; name?: string; source?: string }) {
  return apiFetch<{ sessionId: string; handCount: number; skipped: number; handIds: string[] }>(
    `/wdic/sessions/import`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
