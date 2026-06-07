"use client";

import { useActionState } from "react";
import { createInvite } from "@/actions/invite";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-70"
    >
      {pending ? "생성 중..." : "초대 링크 만들기"}
    </button>
  );
}

export default function InviteMemberForm() {
  const [state, formAction] = useActionState(createInvite, null);

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <SubmitButton />
      </form>

      {state?.error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3">
          <p className="text-danger text-sm">{state.error}</p>
        </div>
      )}

      {state?.inviteUrl && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-3">
          <p className="text-xs text-text-dim break-all">{state.inviteUrl}</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={state.mailtoUrl}
              className="bg-white text-gray-900 text-center font-bold py-2.5 px-3 rounded-lg active:scale-[0.98] transition-all"
            >
              이메일 열기
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.inviteUrl!)}
              className="bg-surface-elevated border border-border text-white font-bold py-2.5 px-3 rounded-lg active:scale-[0.98] transition-all"
            >
              링크 복사
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
