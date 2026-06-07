"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSession } from "@/actions/updateSession";
import { addManualSession } from "@/actions/addManualSession";
import { deleteSession } from "@/actions/deleteSession";
import { useFormStatus } from "react-dom";
import { toDatetimeLocalString, calculateDurationMinutes, formatDuration } from "@/lib/date/utils";

interface SessionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "edit" | "add";
  childId: string;
  session?: {
    id: string;
    start_at: string;
    end_at: string | null;
    report_date: string;
    note: string | null;
    status: string;
  };
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center"
    >
      {pending ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        label
      )}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-danger/10 text-danger font-bold py-3 px-4 rounded-xl hover:bg-danger/20 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center mt-2"
    >
      {pending ? (
        <div className="w-5 h-5 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
      ) : (
        "기록 삭제"
      )}
    </button>
  );
}

export default function SessionEditDialog({
  isOpen,
  onClose,
  mode,
  childId,
  session,
}: SessionEditDialogProps) {
  const isEdit = mode === "edit";
  const defaultStart = session?.start_at ? new Date(session.start_at) : new Date();
  
  // For 'add' mode, default end is 1 hour after start
  const defaultEnd = session?.end_at 
    ? new Date(session.end_at) 
    : isEdit && session?.status === "active" 
      ? null 
      : new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const defaultReportDate = session?.report_date || defaultStart.toISOString().split("T")[0];

  const [startAt, setStartAt] = useState(toDatetimeLocalString(defaultStart));
  const [endAt, setEndAt] = useState(defaultEnd ? toDatetimeLocalString(defaultEnd) : "");
  const [reportDate, setReportDate] = useState(defaultReportDate);
  const [duration, setDuration] = useState(0);

  const action = isEdit ? updateSession : addManualSession;
  const [state, formAction] = useActionState(action, null);
  const [deleteState, deleteAction] = useActionState(deleteSession, null);
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Effect to handle success callbacks
  useEffect(() => {
    if (state?.success || deleteState?.success) {
      onClose();
    }
  }, [state, deleteState, onClose]);

  // Update duration preview
  useEffect(() => {
    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (end > start) {
        setDuration(calculateDurationMinutes(start, end));
      } else {
        setDuration(0);
      }
    }
  }, [startAt, endAt]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-elevated rounded-t-3xl border-t border-white/10 animate-slide-up max-h-[90vh] overflow-y-auto pb-safe">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {isEdit ? "기록 수정" : "세션 추가"}
          </h2>

          {(state?.error || deleteState?.error) && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-6">
              <p className="text-danger text-sm">{state?.error || deleteState?.error}</p>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="childId" value={childId} />
            {isEdit && <input type="hidden" name="sessionId" value={session!.id} />}

            <div className="space-y-1">
              <label className="text-sm text-text-dim ml-1">시작 시각</label>
              <input
                type="datetime-local"
                name="startAt"
                value={startAt}
                onChange={(e) => {
                  setStartAt(e.target.value);
                  // Auto-update report date to match start date if they change the day
                  setReportDate(e.target.value.split("T")[0]);
                }}
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {(!isEdit || session?.status === "closed") && (
              <div className="space-y-1">
                <label className="text-sm text-text-dim ml-1">종료 시각</label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {duration > 0 && (
              <div className="text-sm text-right px-1">
                총 <span className="font-bold text-primary-light">{formatDuration(duration)}</span>
                {duration > 18 * 60 && (
                  <span className="text-warning ml-2">(18시간 초과 주의)</span>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-text-dim ml-1">집계 기준일 (리포트 날짜)</label>
              <input
                type="date"
                name="reportDate"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-text-dim ml-1">메모 (선택사항)</label>
              <textarea
                name="note"
                defaultValue={session?.note || ""}
                rows={2}
                placeholder="특이사항이 있다면 적어주세요."
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-surface-elevated border border-border text-white font-bold py-3 px-4 rounded-xl hover:bg-surface-hover active:scale-[0.98] transition-all"
              >
                취소
              </button>
              <SubmitButton label="저장" />
            </div>
          </form>

          {isEdit && (
            <div className="mt-8 border-t border-border pt-6">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full text-danger text-sm font-medium py-2"
                >
                  기록 삭제하기...
                </button>
              ) : (
                <form action={deleteAction} className="bg-danger/5 border border-danger/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-white mb-3">정말 이 기록을 삭제하시겠습니까?</p>
                  <input type="hidden" name="sessionId" value={session!.id} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 bg-surface-elevated border border-border rounded-lg py-2 text-sm"
                    >
                      취소
                    </button>
                    <div className="flex-1">
                      <DeleteButton />
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
