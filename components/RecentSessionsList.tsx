"use client";

import { useState } from "react";
import SessionEditDialog from "@/components/SessionEditDialog";
import { formatDateDisplay, formatDuration, formatTimeRange } from "@/lib/date/utils";

type RecentSession = {
  id: string;
  start_at: string;
  end_at: string | null;
  report_date: string;
  duration_minutes: number | null;
  note: string | null;
  status: string;
};

interface RecentSessionsListProps {
  childId: string;
  sessions: RecentSession[];
}

export default function RecentSessionsList({ childId, sessions }: RecentSessionsListProps) {
  const [selectedSession, setSelectedSession] = useState<RecentSession | null>(null);

  if (sessions.length === 0) {
    return <div className="text-center py-12 text-text-dim">기록이 없습니다.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => setSelectedSession(session)}
            className={`w-full text-left glass-elevated rounded-xl p-4 border-l-4 active:scale-[0.99] transition-all hover:border-border hover:bg-surface-hover/60 ${
              session.status === "active" ? "border-l-active" : "border-l-success"
            }`}
            aria-label={`${formatDateDisplay(session.report_date)} 기록 수정 또는 삭제`}
          >
            <div className="flex justify-between items-start gap-4 mb-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-text-muted">
                  {formatDateDisplay(session.report_date)}
                </span>
                <span className="text-lg font-bold mt-1 tracking-tight">
                  {formatTimeRange(session.start_at, session.end_at)}
                </span>
              </div>
              <div className="text-right shrink-0">
                {session.status === "active" ? (
                  <span className="bg-active/20 text-active-light text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    진행 중
                  </span>
                ) : (
                  <span className="text-lg font-bold text-success-light">
                    {formatDuration(session.duration_minutes || 0)}
                  </span>
                )}
              </div>
            </div>
            {session.note && (
              <p className="text-sm text-text-dim mt-2 bg-surface/50 p-2 rounded-lg">
                {session.note}
              </p>
            )}
            <div className="mt-3 text-right text-xs font-semibold text-primary-light">
              수정/삭제
            </div>
          </button>
        ))}
      </div>

      {selectedSession && (
        <SessionEditDialog
          isOpen
          onClose={() => setSelectedSession(null)}
          mode="edit"
          childId={childId}
          session={selectedSession}
        />
      )}
    </>
  );
}
