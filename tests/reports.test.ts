import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarCells,
  buildSessionMap,
  buildSummaryMap,
  buildWeeklyChartData,
  sumCurrentMonthMinutes,
  type DailySessionInput,
  type DailySummaryInput,
  type SessionReportTarget,
  type TrackerReportTarget,
} from "../lib/reports/summary";
import { buildCsvRows, escapeCsvCell, toCsv } from "../lib/reports/csv";

const trackers: TrackerReportTarget[] = [
  { id: "tracker-1", targetMinutesPerDay: 60 },
  { id: "tracker-2", targetMinutesPerDay: 120 },
];

const summaries: DailySummaryInput[] = [
  { childId: "tracker-1", reportDate: "2026-06-01", totalMinutes: 30 },
  { childId: "tracker-2", reportDate: "2026-06-01", totalMinutes: 60 },
  { childId: "tracker-1", reportDate: "2026-06-07", totalMinutes: 90 },
];

const sessionTargets: SessionReportTarget[] = [
  { id: "tracker-1", name: "Alpha" },
  { id: "tracker-2", name: "Beta" },
];

const sessions: DailySessionInput[] = [
  {
    childId: "tracker-1",
    reportDate: "2026-06-01",
    startAt: "2026-06-01T00:00:00.000Z",
    endAt: "2026-06-01T01:30:00.000Z",
    durationMinutes: 90,
  },
  {
    childId: "tracker-2",
    reportDate: "2026-06-01",
    startAt: "2026-06-01T03:00:00.000Z",
    endAt: "2026-06-01T03:30:00.000Z",
    durationMinutes: 30,
  },
];

test("buildCalendarCells aggregates tracked minutes per date", () => {
  const summaryMap = buildSummaryMap(summaries);
  const cells = buildCalendarCells(
    trackers,
    summaryMap,
    undefined,
    new Date("2026-06-07T12:00:00+09:00")
  );
  const juneFirst = cells.find((cell) => cell.dateStr === "2026-06-01");
  const juneSeventh = cells.find((cell) => cell.dateStr === "2026-06-07");

  assert.equal(cells.length, 35);
  assert.equal(juneFirst?.totalMinutes, 90);
  assert.equal(juneSeventh?.totalMinutes, 90);
  assert.equal(sumCurrentMonthMinutes(cells), 180);
});

test("buildCalendarCells attaches session rows per date", () => {
  const summaryMap = buildSummaryMap(summaries);
  const sessionMap = buildSessionMap(sessionTargets, sessions);
  const cells = buildCalendarCells(
    trackers,
    summaryMap,
    sessionMap,
    new Date("2026-06-07T12:00:00+09:00")
  );
  const juneFirst = cells.find((cell) => cell.dateStr === "2026-06-01");

  assert.equal(juneFirst?.sessions.length, 2);
  assert.deepEqual(juneFirst?.sessions[0], {
    childId: "tracker-1",
    childName: "Alpha",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    durationMinutes: 90,
  });
  assert.equal(juneFirst?.sessions[1]?.childName, "Beta");
});

test("buildWeeklyChartData fills missing dates and caps percentage", () => {
  const summaryMap = buildSummaryMap(summaries);
  const chartData = buildWeeklyChartData(
    trackers[0],
    summaryMap,
    new Date("2026-06-07T12:00:00+09:00")
  );

  assert.equal(chartData.length, 7);
  assert.deepEqual(
    chartData.map((point) => point.dateStr),
    [
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
    ]
  );
  assert.equal(chartData[0].minutes, 30);
  assert.equal(chartData[1].minutes, 0);
  assert.equal(chartData[6].percentage, 100);
});

test("CSV export escapes cells and includes session timing", () => {
  const rows = buildCsvRows(
    [
      { id: "tracker-1", name: "Workout, AM" },
      { id: "tracker-2", name: "Read \"Book\"" },
    ],
    [
      {
        childId: "tracker-1",
        reportDate: "2026-06-01",
        startAt: "2026-06-01T00:00:00.000Z",
        endAt: "2026-06-01T01:30:00.000Z",
        durationMinutes: 90,
      },
      {
        childId: "tracker-2",
        reportDate: "2026-06-02",
        startAt: "2026-06-02T01:00:00.000Z",
        endAt: "2026-06-02T01:30:00.000Z",
        durationMinutes: 30,
      },
    ]
  );

  assert.equal(escapeCsvCell("Read \"Book\""), "\"Read \"\"Book\"\"\"");
  assert.deepEqual(rows, [
    {
      date: "2026-06-01",
      trackerName: "Workout, AM",
      startAt: "2026-06-01 09:00",
      endAt: "2026-06-01 10:30",
      duration: "1시간 30분",
      minutes: 90,
    },
    {
      date: "2026-06-02",
      trackerName: "Read \"Book\"",
      startAt: "2026-06-02 10:00",
      endAt: "2026-06-02 10:30",
      duration: "30분",
      minutes: 30,
    },
  ]);
  assert.equal(
    toCsv(rows),
    [
      "\uFEFFdate,tracker_name,start_at,end_at,duration,minutes",
      "2026-06-01,\"Workout, AM\",2026-06-01 09:00,2026-06-01 10:30,1시간 30분,90",
      "2026-06-02,\"Read \"\"Book\"\"\",2026-06-02 10:00,2026-06-02 10:30,30분,30",
    ].join("\n")
  );
});
