import { createClient } from "@/lib/supabase/server";
import { formatKST, startOfMonth } from "@/lib/date/utils";
import { buildCsvRows, toCsv } from "@/lib/reports/csv";

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

  const csv = toCsv(
    buildCsvRows(
      (children ?? []).map((child) => ({
        id: child.id,
        name: child.name,
      })),
      (summaries ?? []).map((summary) => ({
        childId: summary.child_id,
        reportDate: summary.report_date,
        totalMinutes: summary.total_minutes,
      }))
    )
  );
  const filename = `time-tracker-${monthStart}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
