import {
  formatDuration,
  formatSessionDateTime,
} from "../date/utils";

export type CsvRow = {
  date: string;
  trackerName: string;
  startAt: string;
  endAt: string;
  duration: string;
  minutes: number;
};

export type CsvTracker = {
  id: string;
  name: string;
};

export type CsvSession = {
  childId: string;
  reportDate: string;
  startAt: string;
  endAt: string | null;
  durationMinutes: number;
};

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function toCsv(rows: CsvRow[]): string {
  const header = [
    "date",
    "tracker_name",
    "start_at",
    "end_at",
    "duration",
    "minutes",
  ];
  const body = rows.map((row) =>
    [row.date, row.trackerName, row.startAt, row.endAt, row.duration, row.minutes]
      .map(escapeCsvCell)
      .join(",")
  );

  return `\uFEFF${[header.join(","), ...body].join("\n")}`;
}

export function buildCsvRows(
  children: CsvTracker[],
  sessions: CsvSession[]
): CsvRow[] {
  const childNames = new Map(children.map((child) => [child.id, child.name]));

  return sessions.map((session) => {
    const minutes = session.durationMinutes;

    return {
      date: session.reportDate,
      trackerName: childNames.get(session.childId) ?? session.childId,
      startAt: formatSessionDateTime(session.startAt),
      endAt: session.endAt ? formatSessionDateTime(session.endAt) : "진행 중",
      duration: formatDuration(minutes),
      minutes,
    };
  });
}
