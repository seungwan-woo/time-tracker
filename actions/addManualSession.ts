"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateDurationMinutes, getReportDate, parseDatetimeLocalString } from "@/lib/date/utils";

type ActionState = { error?: string; success?: boolean };

export async function addManualSession(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const childId = formData.get("childId") as string;
  const startAtStr = formData.get("startAt") as string;
  const endAtStr = formData.get("endAt") as string;
  const noteRaw = formData.get("note") as string;
  const note = noteRaw ? noteRaw.trim() : null;
  const reportDateStr = formData.get("reportDate") as string;

  if (!childId || !startAtStr || !endAtStr) {
    return { error: "필수 항목이 누락되었습니다." };
  }

  const startAt = parseDatetimeLocalString(startAtStr);
  const endAt = parseDatetimeLocalString(endAtStr);

  if (endAt <= startAt) {
    return { error: "종료 시각은 시작 시각보다 늦어야 합니다." };
  }

  const durationMinutes = calculateDurationMinutes(startAt, endAt);
  const reportDate = reportDateStr || getReportDate(startAt);

  // Get family_id
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("family_id")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return { error: "대상 정보를 찾을 수 없습니다." };
  }

  const { data: isMember } = await supabase.rpc("is_family_member", {
    target_family_id: child.family_id,
  });

  if (!isMember) {
    return { error: "Forbidden" };
  }

  const { error: insertError } = await supabase.from("wearing_sessions").insert({
    family_id: child.family_id,
    child_id: childId,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    report_date: reportDate,
    duration_minutes: durationMinutes,
    status: "closed",
    note: note,
    created_by: user.id,
  });

  if (insertError) {
    console.error("Add manual session error:", insertError);
    return { error: "세션 추가에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${childId}`);
  revalidatePath("/reports");

  return { success: true };
}
