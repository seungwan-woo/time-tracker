"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateDurationMinutes, getReportDate } from "@/lib/date/utils";
import type { Database } from "@/types/database";

type ActionState = { error?: string; success?: boolean };
type WearingSessionUpdate = Database["public"]["Tables"]["wearing_sessions"]["Update"];

export async function updateSession(
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

  const sessionId = formData.get("sessionId") as string;
  const startAtStr = formData.get("startAt") as string;
  const endAtStr = formData.get("endAt") as string; // Optional for active sessions
  const noteRaw = formData.get("note") as string;
  const note = noteRaw ? noteRaw.trim() : null;
  const reportDateStr = formData.get("reportDate") as string;

  if (!sessionId || !startAtStr) {
    return { error: "필수 항목이 누락되었습니다." };
  }

  const startAt = new Date(startAtStr);
  const reportDate = reportDateStr || getReportDate(startAt);

  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from("wearing_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { error: "세션을 찾을 수 없습니다." };
  }

  const { data: isMember } = await supabase.rpc("is_family_member", {
    target_family_id: session.family_id,
  });

  if (!isMember) {
    return { error: "Forbidden" };
  }

  const updatePayload: WearingSessionUpdate = {
    start_at: startAt.toISOString(),
    report_date: reportDate,
    note: note,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  // If session is closed, or endAt is provided for active session, calculate duration
  if (session.status === "closed" || endAtStr) {
    const endAt = endAtStr ? new Date(endAtStr) : new Date(session.end_at!);
    
    if (endAt <= startAt) {
      return { error: "종료 시각은 시작 시각보다 늦어야 합니다." };
    }
    
    updatePayload.end_at = endAt.toISOString();
    updatePayload.duration_minutes = calculateDurationMinutes(startAt, endAt);
  }

  const { error: updateError } = await supabase
    .from("wearing_sessions")
    .update(updatePayload)
    .eq("id", sessionId);

  if (updateError) {
    console.error("Update session error:", updateError);
    return { error: "세션 수정에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${session.child_id}`);
  revalidatePath("/reports");

  return { success: true };
}
