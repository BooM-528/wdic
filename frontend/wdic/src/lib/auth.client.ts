// src/lib/auth.client.ts

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_INFO_KEY = 'auth_user_info';

export interface UserInfo {
  id: number;
  display_name: string;
  avatar_url: string;
  tier: string;
  usage?: {
    hand_count: number;
    hand_limit: number;
    extra_hand_balance: number;
    session_count: number;
    session_limit: number;
    extra_session_balance: number;
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setUserInfo(user: UserInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

export function getUserInfo(): UserInfo | null {
  const data = localStorage.getItem(USER_INFO_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export function redirectToLineLogin() {
  const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || '');
  const state = Math.random().toString(36).substring(7);
  
  // Store state for security validation if needed
  localStorage.setItem('line_login_state', state);

  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid&bot_prompt=aggressive`;
  
  window.location.href = url;
}
