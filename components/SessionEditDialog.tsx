"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSession } from "@/actions/updateSession";
import { addManualSession } from "@/actions/addManualSession";
import { deleteSession } from "@/actions/deleteSession";
import { useFormStatus } from "react-dom";
import { toDatetimeLocalString, calculateDurationMinutes, formatDuration, parseDatetimeLocalString } from "@/lib/date/utils";

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

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, value) =>
  value.toString().padStart(2, "0")
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, value) =>
  value.toString().padStart(2, "0")
);

export default function SessionEditDialog({
  isOpen,
  onClose,
  mode,
  childId,
  session,
}: SessionEditDialogProps) {
  const isEdit = mode === "edit";
  const editableSessionId = isEdit ? session?.id : undefined;
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
  const action = isEdit ? updateSession : addManualSession;
  const [state, formAction] = useActionState(action, null);
  const [deleteState, deleteAction] = useActionState(deleteSession, null);
  
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Effect to handle success callbacks
  useEffect(() => {
    if (state?.success || deleteState?.success) {
      onClose();
    }
  }, [state, deleteState, onClose]);

  const duration = (() => {
    if (startAt && endAt) {
      try {
        const start = parseDatetimeLocalString(startAt);
        const end = parseDatetimeLocalString(endAt);
        return end > start ? calculateDurationMinutes(start, end) : 0;
      } catch {
        return 0;
      }
    }

    return 0;
  })();

  const updateDateTime = (
    currentValue: string,
    nextDate: string | undefined,
    nextHour: string | undefined,
    nextMinute: string | undefined
  ) => {
    const [currentDate = "", currentTime = "00:00"] = currentValue.split("T");
    const [currentHour = "00", currentMinute = "00"] = currentTime.split(":");
    const date = nextDate ?? currentDate;
    const hour = nextHour ?? currentHour;
    const minute = nextMinute ?? currentMinute;

    return `${date}T${hour}:${minute}`;
  };

  const editDateTimeField = (
    label: string,
    value: string,
    onChange: (nextValue: string) => void
  ) => {
    const [datePart = "", timePart = "00:00"] = value.split("T");
    const [hourPart = "00", minutePart = "00"] = timePart.split(":");

    return (
      <div className="space-y-3">
        <label className="text-sm text-text-dim ml-1">{label}</label>
        <input
          type="date"
          value={datePart}
          onChange={(event) => {
            onChange(updateDateTime(value, event.target.value, undefined, undefined));
            setShowConfirmSave(false);
          }}
          required
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <select
            value={hourPart}
            onChange={(event) => {
              onChange(updateDateTime(value, undefined, event.target.value, undefined));
              setShowConfirmSave(false);
            }}
            className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}시
              </option>
            ))}
          </select>
          <span className="text-text-dim text-sm font-medium">:</span>
          <select
            value={minutePart}
            onChange={(event) => {
              onChange(updateDateTime(value, undefined, undefined, event.target.value));
              setShowConfirmSave(false);
            }}
            className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {MINUTE_OPTIONS.map((minute) => (
              <option key={minute} value={minute}>
                {minute}분
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-text-dim px-1">24시간 기준으로 저장됩니다.</p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:bottom-6 sm:px-4">
        <div className="w-full max-w-lg glass-elevated rounded-t-3xl border-t border-white/10 animate-slide-up max-h-[90vh] overflow-y-auto pb-safe sm:rounded-3xl sm:border">
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

          <form
            action={formAction}
            className="space-y-5"
            onSubmit={(event) => {
              if (isEdit && !showConfirmSave) {
                event.preventDefault();
                setShowConfirmSave(true);
              }
            }}
          >
            <input type="hidden" name="childId" value={childId} />
            {editableSessionId && (
              <input type="hidden" name="sessionId" value={editableSessionId} />
            )}
            {isEdit && <input type="hidden" name="startAt" value={startAt} />}
            {isEdit && session?.status === "closed" && (
              <input type="hidden" name="endAt" value={endAt} />
            )}

            <div className="space-y-1">
              {isEdit
                ? editDateTimeField("시작 시각", startAt, (nextValue) => {
                    setStartAt(nextValue);
                    setReportDate(nextValue.split("T")[0]);
                  })
                : (
                  <>
                    <label className="text-sm text-text-dim ml-1">시작 시각</label>
                    <input
                      type="datetime-local"
                      name="startAt"
                      value={startAt}
                      onChange={(e) => {
                        setStartAt(e.target.value);
                        setReportDate(e.target.value.split("T")[0]);
                        setShowConfirmSave(false);
                      }}
                      required
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </>
                )}
            </div>

            {(!isEdit || session?.status === "closed") && (
              <div className="space-y-1">
                {isEdit
                  ? editDateTimeField("종료 시각", endAt, setEndAt)
                  : (
                    <>
                      <label className="text-sm text-text-dim ml-1">종료 시각</label>
                      <input
                        type="datetime-local"
                        name="endAt"
                        value={endAt}
                        onChange={(e) => {
                          setEndAt(e.target.value);
                          setShowConfirmSave(false);
                        }}
                        required
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </>
                  )}
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
                onChange={(e) => {
                  setReportDate(e.target.value);
                  setShowConfirmSave(false);
                }}
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
                onChange={() => setShowConfirmSave(false)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {isEdit && showConfirmSave && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-white">이 내용으로 기록을 수정하시겠습니까?</p>
                <p className="text-xs text-text-dim mt-1">
                  확정하면 최근 기록과 리포트에 바로 반영됩니다.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (showConfirmSave) {
                    setShowConfirmSave(false);
                    return;
                  }

                  onClose();
                }}
                className="flex-1 bg-surface-elevated border border-border text-white font-bold py-3 px-4 rounded-xl hover:bg-surface-hover active:scale-[0.98] transition-all"
              >
                {showConfirmSave ? "다시 수정" : "취소"}
              </button>
              <SubmitButton label={isEdit && showConfirmSave ? "수정 확정" : "저장"} />
            </div>
          </form>

          {isEdit && editableSessionId && (
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
                  <input type="hidden" name="sessionId" value={editableSessionId} />
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
      </div>
    </>
  );
}
