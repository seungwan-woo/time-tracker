"use client";

import { useEffect, useState } from "react";
import CircularProgress from "./CircularProgress";
import { formatDuration, calculateDurationMinutes } from "@/lib/date/utils";
import Link from "next/link";
import { startWearing } from "@/actions/startWearing";
import { endWearing } from "@/actions/endWearing";
import TimeAdjustDialog from "./TimeAdjustDialog";
import SessionEditDialog from "./SessionEditDialog";

interface ChildCardProps {
  child: {
    id: string;
    name: string;
    target_minutes_per_day: number;
  };
  activeSession: {
    id: string;
    start_at: string;
  } | null;
  todayTotalMinutes: number; // Only closed sessions
}

export default function ChildCard({
  child,
  activeSession,
  todayTotalMinutes,
}: ChildCardProps) {
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showAddSessionDialog, setShowAddSessionDialog] = useState(false);

  // Update current active session duration every minute
  useEffect(() => {
    if (!activeSession) {
      setCurrentDuration(0);
      return;
    }

    const updateDuration = () => {
      const mins = calculateDurationMinutes(activeSession.start_at, new Date());
      setCurrentDuration(mins > 0 ? mins : 0);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const totalMinutes = todayTotalMinutes + currentDuration;
  const remainingMinutes = Math.max(0, child.target_minutes_per_day - totalMinutes);
  const percentage = Math.round((totalMinutes / child.target_minutes_per_day) * 100);

  const handleStart = async (date: Date) => {
    setIsPending(true);
    try {
      await startWearing(child.id, date.toISOString());
      setShowStartDialog(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleEnd = async (date: Date) => {
    if (!activeSession) return;
    setIsPending(true);
    try {
      await endWearing(activeSession.id, date.toISOString());
      setShowEndDialog(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div
        className={`glass rounded-2xl p-5 relative overflow-hidden transition-all ${
          activeSession ? "border-primary/50 shadow-lg shadow-primary/10 pulse-active" : ""
        }`}
      >
        {/* Active Indicator Background */}
        {activeSession && (
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        )}

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{child.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeSession ? "bg-active" : percentage >= 100 ? "bg-success" : "bg-text-muted"
                  }`}
                />
                <span className="text-sm font-medium text-text-muted">
                  {activeSession
                    ? "착용 중"
                    : percentage >= 100
                    ? "오늘 목표 달성!"
                    : "미착용"}
                </span>
              </div>
            </div>
            
            <CircularProgress percentage={percentage} size={80} strokeWidth={8} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-elevated/50 rounded-xl p-3">
              <p className="text-xs text-text-dim mb-1">오늘 누적</p>
              <p className="text-lg font-bold">{formatDuration(totalMinutes)}</p>
            </div>
            <div className="bg-surface-elevated/50 rounded-xl p-3">
              <p className="text-xs text-text-dim mb-1">남은 시간</p>
              <p className="text-lg font-bold">
                {remainingMinutes > 0 ? formatDuration(remainingMinutes) : "0분"}
              </p>
            </div>
          </div>

          {activeSession && (
            <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-primary-light mb-1">현재 세션 경과 시간</p>
                <p className="font-mono font-bold text-primary-light">
                  {formatDuration(currentDuration)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <span className="w-3 h-3 rounded-full bg-primary-light" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {activeSession ? (
              <button
                onClick={() => setShowEndDialog(true)}
                className="flex-1 bg-surface-elevated border border-border hover:bg-surface-hover text-white font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                착용 종료
              </button>
            ) : (
              <button
                onClick={() => setShowStartDialog(true)}
                className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                착용 시작
              </button>
            )}

            <button
              onClick={() => setShowAddSessionDialog(true)}
              className="w-12 flex flex-none items-center justify-center bg-surface-elevated border border-border rounded-xl hover:bg-surface-hover active:scale-[0.98] transition-all"
              aria-label="세션 수동 추가"
            >
              <svg className="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <Link
              href={`/children/${child.id}`}
              className="w-12 flex flex-none items-center justify-center bg-surface-elevated border border-border rounded-xl hover:bg-surface-hover active:scale-[0.98] transition-all"
              aria-label="세션 상세 보기"
            >
              <svg className="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <TimeAdjustDialog
        isOpen={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onConfirm={handleStart}
        title="시작 시각 확인"
        isPending={isPending}
      />

      <TimeAdjustDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={handleEnd}
        title="종료 시각 확인"
        isPending={isPending}
      />

      <SessionEditDialog
        isOpen={showAddSessionDialog}
        onClose={() => setShowAddSessionDialog(false)}
        mode="add"
        childId={child.id}
      />
    </>
  );
}
