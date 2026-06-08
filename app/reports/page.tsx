import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import {
  formatDuration,
  formatDurationCompact,
  formatKST,
  startOfMonth,
} from "@/lib/date/utils";
import {
  buildCalendarCells,
  buildSessionMap,
  buildSummaryMap,
  buildWeeklyChartData,
  type DailySessionInput,
  sumCurrentMonthMinutes,
  type DailySummaryInput,
  type SessionReportTarget,
  type TrackerReportTarget,
} from "@/lib/reports/summary";

type ReportsPageProps = {
  searchParams: Promise<{ view?: string | string[] | undefined }>;
};

export default async function ReportsPage(props: ReportsPageProps) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  const viewParam = Array.isArray(searchParams.view)
    ? searchParams.view[0]
    : searchParams.view;
  const calendarView = viewParam === "sessions" ? "sessions" : "duration";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's family
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  const familyId = membership.family_id;

  // Get children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("family_id", familyId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen pb-24 relative flex items-center justify-center">
        <p className="text-text-muted">대상 정보가 없습니다.</p>
        <BottomNav />
      </div>
    );
  }

  // Fetch enough daily summaries for both the 7-day chart and current month calendar
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const monthStartStr = formatKST(startOfMonth(new Date()), "yyyy-MM-dd");
  const startDateStr =
    monthStartStr < formatKST(sevenDaysAgo, "yyyy-MM-dd")
      ? monthStartStr
      : formatKST(sevenDaysAgo, "yyyy-MM-dd");

  const [{ data: recentSummaries }, { data: monthSessions }] = await Promise.all([
    supabase
      .from("daily_wearing_summary")
      .select("*")
      .eq("family_id", familyId)
      .gte("report_date", startDateStr)
      .order("report_date", { ascending: true }),
    supabase
      .from("wearing_sessions")
      .select("child_id, report_date, start_at, end_at, duration_minutes")
      .eq("family_id", familyId)
      .eq("status", "closed")
      .is("deleted_at", null)
      .gte("report_date", monthStartStr)
      .order("report_date", { ascending: true })
      .order("start_at", { ascending: true }),
  ]);

  const reportTargets: TrackerReportTarget[] = children.map((child) => ({
    id: child.id,
    targetMinutesPerDay: child.target_minutes_per_day,
  }));
  const sessionTargets: SessionReportTarget[] = children.map((child) => ({
    id: child.id,
    name: child.name,
  }));
  const dailySummaries: DailySummaryInput[] = (recentSummaries ?? []).map(
    (summary) => ({
      childId: summary.child_id,
      reportDate: summary.report_date,
      totalMinutes: summary.total_minutes,
    })
  );
  const dailySessions: DailySessionInput[] = (monthSessions ?? []).map((session) => ({
    childId: session.child_id,
    reportDate: session.report_date,
    startAt: session.start_at,
    endAt: session.end_at,
    durationMinutes: session.duration_minutes ?? 0,
  }));
  const summaryMap = buildSummaryMap(dailySummaries);
  const sessionMap = buildSessionMap(sessionTargets, dailySessions);
  const calendarCells = buildCalendarCells(reportTargets, summaryMap, sessionMap);
  const monthlyTotal = sumCurrentMonthMinutes(calendarCells);

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="app-header-inner">
          <h1 className="text-xl font-bold">시간 리포트</h1>
        </div>
      </header>

      <main className="app-container pt-6 space-y-8">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold">
                {formatKST(new Date(), "yyyy년 M월")}
              </h2>
              <p className="text-sm text-text-dim mt-1">월간 달력</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-dim">이번 달 누적</p>
              <p className="font-bold text-primary-light">
                {formatDuration(monthlyTotal)}
              </p>
            </div>
          </div>
          <div className="mb-4 flex justify-end">
            <div className="inline-flex rounded-xl border border-border bg-surface-elevated p-1 text-xs">
              <Link
                href="/reports"
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  calendarView === "duration"
                    ? "bg-primary text-white"
                    : "text-text-dim hover:text-white"
                }`}
              >
                지속 시간
              </Link>
              <Link
                href="/reports?view=sessions"
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  calendarView === "sessions"
                    ? "bg-primary text-white"
                    : "text-text-dim hover:text-white"
                }`}
              >
                시작/종료/지속
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-dim mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              const hasMinutes = cell.totalMinutes > 0;

              return (
                <div
                  key={cell.dateStr}
                  className={`rounded-lg border p-1.5 sm:p-2 ${
                    calendarView === "sessions"
                      ? "min-h-28 sm:min-h-32"
                      : "min-h-16 sm:min-h-20"
                  } ${
                    cell.isCurrentMonth
                      ? "border-border bg-surface/50"
                      : "border-transparent bg-transparent opacity-40"
                  }`}
                >
                  <div className="text-xs text-text-muted">{cell.day}</div>
                  {hasMinutes && calendarView === "duration" && (
                    <div className="mt-1 rounded-md bg-primary/15 px-1 py-1 text-center">
                      <span className="text-[10px] font-bold text-primary-light">
                        {Math.round(cell.totalMinutes / 60)}h
                      </span>
                    </div>
                  )}
                  {hasMinutes && calendarView === "sessions" && (
                    <div className="mt-1 space-y-1">
                      {cell.sessions.slice(0, 2).map((session, index) => (
                        <div
                          key={`${cell.dateStr}-${session.childId}-${session.startTime}-${index}`}
                          className="overflow-hidden rounded-md bg-primary/12 px-1 py-1 text-[8px] leading-tight text-primary-light sm:px-1.5 sm:text-[9px]"
                        >
                          <div className="truncate font-semibold text-white">
                            {session.childName}
                          </div>
                          <div className="mt-0.5 space-y-0.5 font-mono sm:hidden">
                            <div className="truncate">{session.startTime}</div>
                            <div className="truncate">{session.endTime}</div>
                            <div className="truncate font-semibold">{session.duration}</div>
                          </div>
                          <div className="mt-0.5 hidden grid-cols-[1fr_1fr_auto] gap-1 font-mono sm:grid">
                            <span className="truncate">{session.startTime}</span>
                            <span className="truncate">{session.endTime}</span>
                            <span className="truncate text-right">{session.duration}</span>
                          </div>
                        </div>
                      ))}
                      {cell.sessions.length > 2 && (
                        <div className="text-[9px] text-text-dim">
                          +{cell.sessions.length - 2}건 더 있음
                        </div>
                      )}
                      <div className="pt-0.5 text-right text-[9px] font-semibold text-primary-light">
                        합계 {formatDurationCompact(cell.totalMinutes)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <a
            href="/reports/export"
            className="mt-5 block w-full bg-surface-elevated border border-border text-white font-bold py-3 px-4 rounded-xl text-center active:scale-[0.98] transition-all"
          >
            CSV 다운로드
          </a>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {children.map((child) => {
            const chartData = buildWeeklyChartData(
              {
                id: child.id,
                targetMinutesPerDay: child.target_minutes_per_day,
              },
              summaryMap
            );

            const weekTotal = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
            const weekAvg = Math.round(weekTotal / 7);

            return (
              <div key={child.id} className="glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  {child.name}
                </h2>
                <div className="text-right">
                  <p className="text-xs text-text-dim">최근 7일 평균</p>
                  <p className="font-bold text-primary-light">{formatDuration(weekAvg)}/일</p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-2 mt-8 mb-4 px-2">
                {chartData.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip-like value display on top of bar */}
                    <span className="text-[10px] font-mono text-text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(data.minutes / 60)}h
                    </span>
                    
                    <div className="w-full relative flex justify-center h-32 bg-surface-elevated/30 rounded-t-lg overflow-hidden">
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out ${
                          data.percentage >= 100 ? "bg-success" : "bg-primary"
                        }`}
                        style={{ height: `${data.percentage}%` }}
                      >
                        {/* Shimmer effect for filled bars */}
                        {data.percentage > 0 && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                        )}
                      </div>
                    </div>
                    
                    <span className={`text-xs mt-2 font-medium ${
                      idx === 6 ? "text-primary-light font-bold" : "text-text-dim"
                    }`}>
                      {data.label}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="bg-surface/50 rounded-xl p-3">
                  <p className="text-xs text-text-dim mb-1">하루 목표</p>
                  <p className="font-bold">{formatDuration(child.target_minutes_per_day)}</p>
                </div>
                <div className="bg-surface/50 rounded-xl p-3">
                  <p className="text-xs text-text-dim mb-1">이번 주 누적</p>
                  <p className="font-bold">{formatDuration(weekTotal)}</p>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
