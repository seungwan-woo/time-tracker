"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getReportDate } from "@/lib/date/utils";

export async function startWearing(childId: string, startAtStr?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if child belongs to user's family
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("family_id")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    throw new Error("Child not found");
  }

  // Check family membership via RPC or direct query
  const { data: isMember } = await supabase.rpc("is_family_member", {
    target_family_id: child.family_id,
  });

  if (!isMember) {
    throw new Error("Forbidden");
  }

  // Check for existing active session (the unique index also prevents this)
  const { data: existingSession } = await supabase
    .from("wearing_sessions")
    .select("id")
    .eq("child_id", childId)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (existingSession) {
    throw new Error("Already wearing");
  }

  // Insert active session
  const startAt = startAtStr ? new Date(startAtStr) : new Date();
  const reportDate = getReportDate(startAt);

  const { error: insertError } = await supabase.from("wearing_sessions").insert({
    family_id: child.family_id,
    child_id: childId,
    start_at: startAt.toISOString(),
    report_date: reportDate,
    status: "active",
    created_by: user.id,
  });

  if (insertError) {
    console.error("Start wearing error:", insertError);
    throw new Error("Failed to start session");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${childId}`);
}
