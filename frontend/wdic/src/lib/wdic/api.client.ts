import { apiFetch } from "@/lib/fetcher.client";
import type { WdicHandDetail, WdicSession, WdicSessionHandsResponse, WdicHandAnalysis } from "./types";

export async function listSessions(limit = 50): Promise<WdicSession[]> {
  return apiFetch<WdicSession[]>(`/wdic/sessions?limit=${limit}`, { method: "GET" });
}

interface HandsFilter {
  position?: string;
  status?: string;
  recommended?: boolean;
}

export async function getSessionHands(sessionId: string, limit = 200, filters?: HandsFilter): Promise<WdicSessionHandsResponse> {
  let url = `/wdic/sessions/${sessionId}/hands?limit=${limit}`;
  if (filters?.position) url += `&position=${encodeURIComponent(filters.position)}`;
  if (filters?.status) url += `&status=${encodeURIComponent(filters.status)}`;
  if (filters?.recommended) url += `&recommended=true`;
  return apiFetch<WdicSessionHandsResponse>(url, { method: "GET" });
}

export async function getHandDetail(handId: string): Promise<WdicHandDetail> {
  return apiFetch<WdicHandDetail>(`/wdic/hands/${handId}`, { method: "GET" });
}

export async function analyzeHand(handId: string, force = false, lang = "th"): Promise<WdicHandAnalysis> {
  return apiFetch<WdicHandAnalysis>(`/wdic/hands/${handId}/analyze`, { 
    method: "POST",
    body: JSON.stringify({ force, lang })
  });
}

export async function analyzeSession(sessionId: string, force = false, lang = "th"): Promise<any> {
  return apiFetch<any>(`/wdic/sessions/${sessionId}/analyze`, {
    method: "POST",
    body: JSON.stringify({ force, lang })
  });
}

export async function getSessionAnalysis(sessionId: string): Promise<any> {
  return apiFetch<any>(`/wdic/sessions/${sessionId}/analyze`, {
    method: "GET"
  });
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

export type { WdicHandDetail, WdicSession, WdicSessionHandsResponse, WdicHandAnalysis };
