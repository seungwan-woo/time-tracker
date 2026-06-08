"use client";

import { useState } from "react";
import { formatKST, parseDatetimeLocalString, toDatetimeLocalString } from "@/lib/date/utils";

interface TimeAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  title: string;
  defaultDate?: Date;
  minDate?: Date;
  isPending?: boolean;
}

export default function TimeAdjustDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  defaultDate,
  minDate,
  isPending = false,
}: TimeAdjustDialogProps) {
  const [selectedValue, setSelectedValue] = useState(() =>
    toDatetimeLocalString(defaultDate ?? new Date())
  );

  if (!isOpen) return null;

  const selectedDate = (() => {
    try {
      return parseDatetimeLocalString(selectedValue);
    } catch {
      return null;
    }
  })();
  const isValidDate = selectedDate !== null;
  const isAfterMinDate = !minDate || (isValidDate && selectedDate >= minDate);
  const canConfirm = isValidDate && isAfterMinDate;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:bottom-6 sm:px-4">
        <div className="w-full max-w-md glass-elevated rounded-t-3xl border-t border-white/10 animate-slide-up pb-safe sm:rounded-3xl sm:border">
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />

          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-center">{title}</h2>

            <div className="text-center mb-8">
              <div className="text-4xl font-mono font-bold text-primary-light mb-2">
                {isValidDate ? formatKST(selectedDate, "HH:mm") : "--:--"}
              </div>
              <div className="text-sm text-text-dim">
                {isValidDate ? formatKST(selectedDate, "yyyy년 MM월 dd일") : "시간을 선택해주세요"}
              </div>
            </div>

            <div className="mb-8 space-y-2">
              <label className="text-sm text-text-dim ml-1" htmlFor="wearing-time">
                기록 시각
              </label>
              <input
                id="wearing-time"
                type="datetime-local"
                value={selectedValue}
                min={minDate ? toDatetimeLocalString(minDate) : undefined}
                onChange={(event) => setSelectedValue(event.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {!isAfterMinDate && (
                <p className="text-danger text-sm px-1">
                  시작 시각보다 늦은 시간을 선택해주세요.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 bg-surface-elevated border border-border text-white font-bold py-3 px-4 rounded-xl hover:bg-surface-hover active:scale-[0.98]"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (canConfirm) {
                    onConfirm(selectedDate);
                  }
                }}
                disabled={isPending || !canConfirm}
                className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "확인"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
