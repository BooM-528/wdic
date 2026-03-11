import { getGuestId } from './guest.client';
import { getAccessToken } from './auth.client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ApiFetchOptions = RequestInit & {
  skipJson?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipJson, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'X-Guest-Id': getGuestId(),
    ...(customHeaders as Record<string, string> | undefined),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 👉 default เป็น JSON
  if (!skipJson) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  });

  if (!res.ok) {
    let error: any = {};
    try {
      error = await res.json();
    } catch {}
    throw new Error(error.detail || 'API Error');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
