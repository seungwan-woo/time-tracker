"use client";

import { createClient } from "@/lib/supabase/client";
import { login, signup } from "@/actions/auth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");
  const showDevAuth = process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "true";

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 w-[min(20rem,calc(100vw-3rem))] sm:w-full sm:max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Time Tracker
          </h1>
          <p className="text-text-muted text-sm leading-relaxed">
            중요한 활동 시간을 쉽고 정확하게
            <br />
            기록하고 관리하세요
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full glass rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
              <p className="text-danger text-sm">
                로그인에 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-4 px-6 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 로그인
          </button>

          {showDevAuth && (
            <div className="border-t border-border pt-5 space-y-3">
              <form action={login} className="space-y-3">
                <input
                  type="hidden"
                  name="next"
                  value={next ?? ""}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="dev@example.com"
                  required
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="password"
                  required
                  minLength={6}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="bg-surface-elevated border border-border text-white font-bold py-3 px-4 rounded-xl hover:bg-surface-hover active:scale-[0.98] transition-all"
                  >
                    로그인
                  </button>
                  <button
                    formAction={signup}
                    className="bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] transition-all"
                  >
                    가입
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="text-text-dim text-xs text-center leading-relaxed">
            로그인하면 가족 구성원과 함께
            <br />
            시간 기록을 공유할 수 있습니다.
          </p>
        </div>

        {/* Footer */}
        <p className="text-text-dim text-xs text-center">
          개인정보는 안전하게 보호됩니다
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
