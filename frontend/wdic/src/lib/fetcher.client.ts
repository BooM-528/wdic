import { getGuestId } from './guest.client';
import { getAccessToken } from './auth.client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

type ApiFetchOptions = RequestInit & {
  skipJson?: boolean;
};

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/accounts/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      // Refresh token is also expired — force logout
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('auth_user_info');
      return null;
    }

    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    // If server rotates refresh tokens, store the new one
    if (data.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    }
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipJson, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'X-Guest-Id': getGuestId(),
    ...(customHeaders as Record<string, string> | undefined),
  };

  let token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 👉 default เป็น JSON
  if (!skipJson) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  });

  // 🔄 Auto-refresh: if 401 and we have a refresh token, try refreshing
  if (res.status === 401 && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers,
      });
    }
  }

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
