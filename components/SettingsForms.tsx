"use client";

import { useActionState } from "react";
import {
  deactivateTracker,
  resetFamilyData,
  updateFamily,
  updateProfile,
  upsertTracker,
} from "@/actions/settings";
import { useFormStatus } from "react-dom";

type Tracker = {
  id: string;
  name: string;
  target_minutes_per_day: number;
};

type FormState = {
  error?: string;
  success?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-70"
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: FormState | null }) {
  if (!state?.error && !state?.success) return null;

  return (
    <p className={`text-xs ${state.error ? "text-danger" : "text-success-light"}`}>
      {state.error ?? state.success}
    </p>
  );
}

export function ProfileForm({
  displayName,
}: {
  displayName: string | null;
}) {
  const [state, formAction] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-3">
      <label className="text-sm text-text-dim" htmlFor="displayName">
        내 이름
      </label>
      <div className="flex gap-2">
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName ?? ""}
          placeholder="표시 이름"
          className="min-w-0 flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <SubmitButton label="저장" />
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function FamilyForm({
  familyName,
  canEdit,
}: {
  familyName: string | null;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(updateFamily, null);

  return (
    <form action={formAction} className="space-y-3">
      <label className="text-sm text-text-dim" htmlFor="familyName">
        공간 이름
      </label>
      <div className="flex gap-2">
        <input
          id="familyName"
          name="familyName"
          type="text"
          defaultValue={familyName ?? ""}
          disabled={!canEdit}
          className="min-w-0 flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <SubmitButton label="저장" />
      </div>
      {!canEdit && (
        <p className="text-xs text-text-dim">관리자만 수정할 수 있습니다.</p>
      )}
      <FormMessage state={state} />
    </form>
  );
}

export function TrackerManager({ trackers }: { trackers: Tracker[] }) {
  const [state, formAction] = useActionState(upsertTracker, null);
  const canAdd = trackers.length < 3;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {trackers.map((tracker) => (
          <form
            key={tracker.id}
            action={formAction}
            className="bg-surface/60 border border-border rounded-xl p-3 space-y-3"
          >
            <input type="hidden" name="trackerId" value={tracker.id} />
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <input
                name="name"
                type="text"
                defaultValue={tracker.name}
                className="min-w-0 bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                name="targetMinutes"
                type="number"
                min={1}
                max={1440}
                defaultValue={tracker.target_minutes_per_day}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <SubmitButton label="저장" />
              <button
                formAction={deactivateTracker}
                className="bg-surface-elevated border border-border text-danger font-bold py-2.5 px-4 rounded-xl active:scale-[0.98] transition-all"
              >
                삭제
              </button>
            </div>
          </form>
        ))}
      </div>

      {canAdd && (
        <form action={formAction} className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-bold">대상 추가</p>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <input
              name="name"
              type="text"
              placeholder="예: 운동"
              className="min-w-0 bg-surface border border-border rounded-lg px-3 py-2 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              name="targetMinutes"
              type="number"
              min={1}
              max={1440}
              defaultValue={60}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <SubmitButton label="추가" />
        </form>
      )}

      {!canAdd && (
        <p className="text-xs text-text-dim">대상은 최대 3개까지 관리할 수 있습니다.</p>
      )}

      <FormMessage state={state} />
    </div>
  );
}

export function ResetDataForm({ canReset }: { canReset: boolean }) {
  const [state, formAction] = useActionState(resetFamilyData, null);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="confirmText"
        type="text"
        placeholder="RESET"
        disabled={!canReset}
        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-dim disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <button
        type="submit"
        disabled={!canReset}
        className="w-full bg-danger/10 text-danger border border-danger/20 font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60"
      >
        모든 기록 초기화
      </button>
      <p className="text-xs text-text-dim">
        관리자만 실행할 수 있으며, 기록은 화면에서 제외되도록 초기화됩니다.
      </p>
      <FormMessage state={state} />
    </form>
  );
}
