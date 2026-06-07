import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarCells,
  buildSummaryMap,
  buildWeeklyChartData,
  sumCurrentMonthMinutes,
  type DailySummaryInput,
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

test("buildCalendarCells aggregates tracked minutes per date", () => {
  const summaryMap = buildSummaryMap(summaries);
  const cells = buildCalendarCells(
    trackers,
    summaryMap,
    new Date("2026-06-07T12:00:00+09:00")
  );
  const juneFirst = cells.find((cell) => cell.dateStr === "2026-06-01");
  const juneSeventh = cells.find((cell) => cell.dateStr === "2026-06-07");

  assert.equal(cells.length, 35);
  assert.equal(juneFirst?.totalMinutes, 90);
  assert.equal(juneSeventh?.totalMinutes, 90);
  assert.equal(sumCurrentMonthMinutes(cells), 180);
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

test("CSV export escapes cells and formats hours", () => {
  const rows = buildCsvRows(
    [
      { id: "tracker-1", name: "Workout, AM" },
      { id: "tracker-2", name: "Read \"Book\"" },
    ],
    [
      { childId: "tracker-1", reportDate: "2026-06-01", totalMinutes: 90 },
      { childId: "tracker-2", reportDate: "2026-06-02", totalMinutes: 30 },
    ]
  );

  assert.equal(escapeCsvCell("Read \"Book\""), "\"Read \"\"Book\"\"\"");
  assert.deepEqual(rows, [
    {
      date: "2026-06-01",
      trackerName: "Workout, AM",
      minutes: 90,
      hours: "1.50",
    },
    {
      date: "2026-06-02",
      trackerName: "Read \"Book\"",
      minutes: 30,
      hours: "0.50",
    },
  ]);
  assert.equal(
    toCsv(rows),
    [
      "date,tracker_name,minutes,hours",
      "2026-06-01,\"Workout, AM\",90,1.50",
      "2026-06-02,\"Read \"\"Book\"\"\",30,0.50",
    ].join("\n")
  );
});
