"use client";

import { useActionState } from "react";
import { submitOnboarding } from "@/actions/onboarding";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-8 bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
    >
      {pending ? (
        <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
      ) : (
        "시작하기"
      )}
    </button>
  );
}

export default function OnboardingPage() {
  const [state, formAction] = useActionState(submitOnboarding, null);

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-y-auto pb-safe">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute -top-1/4 -right-1/4 w-full h-full rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.22 250) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="flex-1 w-full max-w-md mx-auto pt-8 pb-12 flex flex-col">
        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">환영합니다!</h1>
          <p className="text-text-muted">
            사용 전 간단한 초기 설정이 필요합니다.
          </p>
        </div>

        <form action={formAction} className="space-y-6 flex-1 flex flex-col">
          {state?.error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-center">
              <p className="text-danger text-sm">{state.error}</p>
            </div>
          )}

          {/* Family Section */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">1. 가족 공간 이름</h2>
            <div>
              <label htmlFor="familyName" className="block text-sm text-text-dim mb-2">
                어떤 이름으로 부를까요?
              </label>
              <input
                id="familyName"
                name="familyName"
                type="text"
                defaultValue="우리 가족"
                placeholder="예: 우리 가족, 지훈이네"
                required
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {state?.fieldErrors?.familyName && (
                <p className="text-danger text-xs mt-1">
                  {state.fieldErrors.familyName[0]}
                </p>
              )}
            </div>
          </div>

          {/* Child 1 Section */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">2. 첫 번째 대상</h2>
            <div>
              <label htmlFor="child1Name" className="block text-sm text-text-dim mb-2">
                이름
              </label>
              <input
                id="child1Name"
                name="child1Name"
                type="text"
                placeholder="예: 운동, 공부, 프로젝트"
                required
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {state?.fieldErrors?.child1Name && (
                <p className="text-danger text-xs mt-1">
                  {state.fieldErrors.child1Name[0]}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="child1Target" className="block text-sm text-text-dim mb-2">
                하루 목표 시간 (분)
              </label>
              <input
                id="child1Target"
                name="child1Target"
                type="number"
                defaultValue={720}
                min={60}
                max={1440}
                required
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="text-xs text-text-dim mt-2">기본값: 12시간 (720분)</p>
            </div>
          </div>

          {/* Second tracker section (optional) */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">3. 두 번째 대상</h2>
              <span className="text-xs bg-surface-elevated px-2 py-1 rounded-md text-text-dim">
                선택사항
              </span>
            </div>
            <div>
              <label htmlFor="child2Name" className="block text-sm text-text-dim mb-2">
                이름
              </label>
              <input
                id="child2Name"
                name="child2Name"
                type="text"
                placeholder="예: 독서, 회고"
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="child2Target" className="block text-sm text-text-dim mb-2">
                하루 목표 시간 (분)
              </label>
              <input
                id="child2Target"
                name="child2Target"
                type="number"
                defaultValue={720}
                min={60}
                max={1440}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mt-auto pt-4">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
