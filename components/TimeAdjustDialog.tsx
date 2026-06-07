"use client";

import { useState } from "react";
import { format } from "date-fns";

interface TimeAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  title: string;
  defaultDate?: Date;
  isPending?: boolean;
}

export default function TimeAdjustDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  defaultDate = new Date(),
  isPending = false,
}: TimeAdjustDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);

  if (!isOpen) return null;

  const adjustMinutes = (mins: number) => {
    setSelectedDate(new Date(selectedDate.getTime() + mins * 60000));
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-elevated rounded-t-3xl border-t border-white/10 animate-slide-up pb-safe">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-center">{title}</h2>
          
          <div className="text-center mb-8">
            <div className="text-4xl font-mono font-bold text-primary-light mb-2">
              {format(selectedDate, "HH:mm")}
            </div>
            <div className="text-sm text-text-dim">
              {format(selectedDate, "yyyy년 MM월 dd일")}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            <button onClick={() => adjustMinutes(-30)} className="bg-surface border border-border py-2 rounded-xl text-sm">-30분</button>
            <button onClick={() => adjustMinutes(-10)} className="bg-surface border border-border py-2 rounded-xl text-sm">-10분</button>
            <button onClick={() => adjustMinutes(-5)} className="bg-surface border border-border py-2 rounded-xl text-sm">-5분</button>
            <button onClick={() => adjustMinutes(-1)} className="bg-surface border border-border py-2 rounded-xl text-sm">-1분</button>
            <button onClick={() => adjustMinutes(1)} className="bg-surface border border-border py-2 rounded-xl text-sm">+1분</button>
            <button onClick={() => adjustMinutes(5)} className="bg-surface border border-border py-2 rounded-xl text-sm">+5분</button>
            <button onClick={() => adjustMinutes(10)} className="bg-surface border border-border py-2 rounded-xl text-sm">+10분</button>
            <button onClick={() => adjustMinutes(30)} className="bg-surface border border-border py-2 rounded-xl text-sm">+30분</button>
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
              onClick={() => onConfirm(selectedDate)}
              disabled={isPending}
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
    </>
  );
}
