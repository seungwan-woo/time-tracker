"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateDurationMinutes } from "@/lib/date/utils";

function parseEndAt(endAtStr: string | undefined): Date {
  const endAt = endAtStr ? new Date(endAtStr) : new Date();

  if (Number.isNaN(endAt.getTime())) {
    throw new Error("종료 시각을 다시 선택해주세요.");
  }

  return endAt;
}

export async function endWearing(sessionId: string, endAtStr?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!sessionId) {
    throw new Error("종료할 기록을 찾을 수 없습니다.");
  }

  // Get session details to verify permission and calculate duration
  const { data: session, error: sessionError } = await supabase
    .from("wearing_sessions")
    .select("id, family_id, child_id, start_at")
    .eq("id", sessionId)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (sessionError || !session) {
    throw new Error("Session not found or already closed");
  }

  // Check family membership
  const { data: isMember } = await supabase.rpc("is_family_member", {
    target_family_id: session.family_id,
  });

  if (!isMember) {
    throw new Error("Forbidden");
  }

  // Calculate duration
  const startAt = new Date(session.start_at);
  const endAt = parseEndAt(endAtStr);

  if (endAt <= startAt) {
    throw new Error("종료 시각은 시작 시각보다 늦어야 합니다.");
  }

  const durationMinutes = calculateDurationMinutes(startAt, endAt);

  // Update session
  const { error: updateError } = await supabase
    .from("wearing_sessions")
    .update({
      end_at: endAt.toISOString(),
      duration_minutes: durationMinutes,
      status: "closed",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "active")
    .is("deleted_at", null)
    .select("id")
    .single();

  if (updateError) {
    console.error("End wearing error:", updateError);
    if (updateError.code === "PGRST116") {
      throw new Error("이미 종료되었거나 찾을 수 없는 기록입니다.");
    }

    throw new Error("기록 종료에 실패했습니다.");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${session.child_id}`);
  revalidatePath("/reports");
}
