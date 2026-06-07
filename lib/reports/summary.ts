import {
  addDays,
  endOfMonth,
  formatDurationCompact,
  formatKST,
  formatSessionEndTime,
  startOfMonth,
} from "../date/utils";

export type ChartPoint = {
  dateStr: string;
  label: string;
  minutes: number;
  percentage: number;
};

export type CalendarCell = {
  dateStr: string;
  day: string;
  isCurrentMonth: boolean;
  totalMinutes: number;
  sessions: CalendarSession[];
};

export type TrackerReportTarget = {
  id: string;
  targetMinutesPerDay: number;
};

export type DailySummaryInput = {
  childId: string;
  reportDate: string;
  totalMinutes: number;
};

export type DailySessionInput = {
  childId: string;
  reportDate: string;
  startAt: string;
  endAt: string | null;
  durationMinutes: number;
};

export type SessionReportTarget = {
  id: string;
  name: string;
};

export type CalendarSession = {
  childId: string;
  childName: string;
  startTime: string;
  endTime: string;
  duration: string;
  durationMinutes: number;
};

type SummaryMap = ReadonlyMap<string, number>;
type SessionMap = ReadonlyMap<string, CalendarSession[]>;

function getSummaryKey(childId: string, dateStr: string): string {
  return `${childId}:${dateStr}`;
}

export function buildSummaryMap(summaries: DailySummaryInput[]): SummaryMap {
  return new Map(
    summaries.map((summary) => [
      getSummaryKey(summary.childId, summary.reportDate),
      summary.totalMinutes,
    ])
  );
}

export function buildSessionMap(
  children: SessionReportTarget[],
  sessions: DailySessionInput[]
): SessionMap {
  const childNames = new Map(children.map((child) => [child.id, child.name]));
  const entries = new Map<string, CalendarSession[]>();

  for (const session of sessions) {
    const dateSessions = entries.get(session.reportDate) ?? [];
    dateSessions.push({
      childId: session.childId,
      childName: childNames.get(session.childId) ?? session.childId,
      startTime: formatKST(session.startAt, "HH:mm"),
      endTime: formatSessionEndTime(session.startAt, session.endAt),
      duration: formatDurationCompact(session.durationMinutes),
      durationMinutes: session.durationMinutes,
    });
    entries.set(session.reportDate, dateSessions);
  }

  for (const [dateStr, dateSessions] of entries) {
    entries.set(
      dateStr,
      [...dateSessions].sort((left, right) =>
        left.startTime.localeCompare(right.startTime)
      )
    );
  }

  return entries;
}

export function getSummaryMinutes(
  summaryMap: SummaryMap,
  childId: string,
  dateStr: string
): number {
  return summaryMap.get(getSummaryKey(childId, dateStr)) ?? 0;
}

export function buildWeeklyChartData(
  child: TrackerReportTarget,
  summaryMap: SummaryMap,
  today: Date = new Date()
): ChartPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, -(6 - index));
    const dateStr = formatKST(date, "yyyy-MM-dd");
    const minutes = getSummaryMinutes(summaryMap, child.id, dateStr);

    return {
      dateStr,
      label: formatKST(date, "E"),
      minutes,
      percentage:
        child.targetMinutesPerDay <= 0
          ? 0
          : Math.min((minutes / child.targetMinutesPerDay) * 100, 100),
    };
  });
}

export function buildCalendarCells(
  children: TrackerReportTarget[],
  summaryMap: SummaryMap,
  sessionMap: SessionMap = new Map(),
  today: Date = new Date()
): CalendarCell[] {
  const monthStart = startOfMonth(today);
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
      sessions: sessionMap.get(dateStr) ?? [],
    };
  });
}

export function sumCurrentMonthMinutes(cells: CalendarCell[]): number {
  return cells.reduce(
    (sum, cell) => sum + (cell.isCurrentMonth ? cell.totalMinutes : 0),
    0
  );
}
