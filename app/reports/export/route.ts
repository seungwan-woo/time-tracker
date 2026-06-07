import { createClient } from "@/lib/supabase/server";
import { formatKST, startOfMonth } from "@/lib/date/utils";
import type { Child, DailyWearingSummary } from "@/types/database";

type CsvRow = {
  date: string;
  trackerName: string;
  minutes: number;
  hours: string;
};

function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function toCsv(rows: CsvRow[]): string {
  const header = ["date", "tracker_name", "minutes", "hours"];
  const body = rows.map((row) =>
    [row.date, row.trackerName, row.minutes, row.hours]
      .map(escapeCsvCell)
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}

function buildRows(
  children: Child[],
  summaries: DailyWearingSummary[]
): CsvRow[] {
  const childNames = new Map(children.map((child) => [child.id, child.name]));

  return summaries.map((summary) => {
    const minutes = summary.total_minutes;

    return {
      date: summary.report_date,
      trackerName: childNames.get(summary.child_id) ?? summary.child_id,
      minutes,
      hours: (minutes / 60).toFixed(2),
    };
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return new Response("No family", { status: 404 });
  }

  const monthStart = formatKST(startOfMonth(new Date()), "yyyy-MM-dd");
  const [{ data: children }, { data: summaries }] = await Promise.all([
    supabase
      .from("children")
      .select("*")
      .eq("family_id", membership.family_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("daily_wearing_summary")
      .select("*")
      .eq("family_id", membership.family_id)
      .gte("report_date", monthStart)
      .order("report_date", { ascending: true }),
  ]);

  const csv = toCsv(buildRows(children ?? [], summaries ?? []));
  const filename = `time-tracker-${monthStart}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
