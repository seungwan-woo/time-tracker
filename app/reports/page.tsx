import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import {
  addDays,
  endOfMonth,
  formatDuration,
  formatKST,
  startOfMonth,
} from "@/lib/date/utils";
import type { Child, DailyWearingSummary } from "@/types/database";

type ChartPoint = {
  dateStr: string;
  label: string;
  minutes: number;
  percentage: number;
};

type CalendarCell = {
  dateStr: string;
  day: string;
  isCurrentMonth: boolean;
  totalMinutes: number;
};

function getSummaryKey(childId: string, dateStr: string): string {
  return `${childId}:${dateStr}`;
}

function buildSummaryMap(
  summaries: DailyWearingSummary[] | null
): Map<string, number> {
  return new Map(
    (summaries ?? []).map((summary) => [
      getSummaryKey(summary.child_id, summary.report_date),
      summary.total_minutes,
    ])
  );
}

function getSummaryMinutes(
  summaryMap: Map<string, number>,
  childId: string,
  dateStr: string
): number {
  return summaryMap.get(getSummaryKey(childId, dateStr)) ?? 0;
}

function buildWeeklyChartData(
  child: Child,
  summaryMap: Map<string, number>
): ChartPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    const dateStr = formatKST(d, "yyyy-MM-dd");
    const minutes = getSummaryMinutes(summaryMap, child.id, dateStr);

    return {
      dateStr,
      label: formatKST(d, "E"),
      minutes,
      percentage: Math.min((minutes / child.target_minutes_per_day) * 100, 100),
    };
  });
}

function buildCalendarCells(
  children: Child[],
  summaryMap: Map<string, number>
): CalendarCell[] {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const leadingDays = monthStart.getDay();
  const firstCellDate = addDays(monthStart, -leadingDays);
  const totalCells = Math.ceil((leadingDays + monthEnd.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = addDays(firstCellDate, index);
    const dateStr = formatKST(date, "yyyy-MM-dd");
    const totalMinutes = children.reduce(
      (sum, child) => sum + getSummaryMinutes(summaryMap, child.id, dateStr),
      0
    );

    return {
      dateStr,
      day: formatKST(date, "d"),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      totalMinutes,
    };
  });
}

export default async function ReportsPage() {
  const supabase = await createClient();

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

  const { data: recentSummaries } = await supabase
    .from("daily_wearing_summary")
    .select("*")
    .eq("family_id", familyId)
    .gte("report_date", startDateStr)
    .order("report_date", { ascending: true });

  const summaryMap = buildSummaryMap(recentSummaries);
  const calendarCells = buildCalendarCells(children, summaryMap);
  const monthlyTotal = calendarCells.reduce(
    (sum, cell) => sum + (cell.isCurrentMonth ? cell.totalMinutes : 0),
    0
  );

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold">시간 리포트</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-8">
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

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-dim mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const hasMinutes = cell.totalMinutes > 0;

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-16 rounded-lg border p-1.5 ${
                    cell.isCurrentMonth
                      ? "border-border bg-surface/50"
                      : "border-transparent bg-transparent opacity-40"
                  }`}
                >
                  <div className="text-xs text-text-muted">{cell.day}</div>
                  {hasMinutes && (
                    <div className="mt-1 rounded-md bg-primary/15 px-1 py-1 text-center">
                      <span className="text-[10px] font-bold text-primary-light">
                        {Math.round(cell.totalMinutes / 60)}h
                      </span>
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

        {children.map((child) => {
          const chartData = buildWeeklyChartData(child, summaryMap);

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
      </main>

      <BottomNav />
    </div>
  );
}
