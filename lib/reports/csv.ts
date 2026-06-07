export type CsvRow = {
  date: string;
  trackerName: string;
  minutes: number;
  hours: string;
};

export type CsvTracker = {
  id: string;
  name: string;
};

export type CsvSummary = {
  childId: string;
  reportDate: string;
  totalMinutes: number;
};

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function toCsv(rows: CsvRow[]): string {
  const header = ["date", "tracker_name", "minutes", "hours"];
  const body = rows.map((row) =>
    [row.date, row.trackerName, row.minutes, row.hours]
      .map(escapeCsvCell)
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}

export function buildCsvRows(
  children: CsvTracker[],
  summaries: CsvSummary[]
): CsvRow[] {
  const childNames = new Map(children.map((child) => [child.id, child.name]));

  return summaries.map((summary) => {
    const minutes = summary.totalMinutes;

    return {
      date: summary.reportDate,
      trackerName: childNames.get(summary.childId) ?? summary.childId,
      minutes,
      hours: (minutes / 60).toFixed(2),
    };
  });
}
