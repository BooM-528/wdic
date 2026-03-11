// src/app/auth/callback/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/fetcher.client";
import { setTokens, setUserInfo } from "@/lib/auth.client";
import { getGuestId } from "@/lib/guest.client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const returnedState = searchParams.get("state");

    if (error) {
      console.error("LINE Login Error:", error);
      router.push("/?login_error=" + encodeURIComponent(error));
      return;
    }

    // Validate state to prevent CSRF attacks
    const savedState = localStorage.getItem("line_login_state");
    if (savedState && returnedState !== savedState) {
      console.error("State mismatch — possible CSRF attack");
      router.push("/?login_error=state_mismatch");
      return;
    }
    // Clean up stored state
    localStorage.removeItem("line_login_state");

    if (code) {
      handleCallback(code);
    }
  }, [searchParams, router]);

  async function handleCallback(code: string) {
    try {
      const resp = await apiFetch<any>("/accounts/line-login", {
        method: "POST",
        body: JSON.stringify({
          code,
          guest_id: getGuestId(),
          redirect_uri: process.env.NEXT_PUBLIC_LINE_REDIRECT_URI,
        }),
      });

      if (resp.access && resp.refresh) {
        setTokens(resp.access, resp.refresh);
        setUserInfo(resp.user);
        router.push("/wdic"); // Redirect to dashboard
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      router.push("/?login_error=" + encodeURIComponent(err?.message || "login_failed"));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#D9114A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
      </div>
    </div>
  );
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
