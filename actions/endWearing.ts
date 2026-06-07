"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateDurationMinutes } from "@/lib/date/utils";

export async function endWearing(sessionId: string, endAtStr?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get session details to verify permission and calculate duration
  const { data: session, error: sessionError } = await supabase
    .from("wearing_sessions")
    .select("*, child_id")
    .eq("id", sessionId)
    .eq("status", "active")
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
  const endAt = endAtStr ? new Date(endAtStr) : new Date();

  if (endAt < startAt) {
    throw new Error("End time must be after start time");
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
    .eq("id", sessionId);

  if (updateError) {
    console.error("End wearing error:", updateError);
    throw new Error("Failed to end session");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${session.child_id}`);
}
