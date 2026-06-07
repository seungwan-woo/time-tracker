"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionState = { error?: string; success?: boolean };

export async function deleteSession(
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

  if (!sessionId) {
    return { error: "세션 ID가 누락되었습니다." };
  }

  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from("wearing_sessions")
    .select("family_id, child_id")
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

  // Soft delete
  const { error: deleteError } = await supabase
    .from("wearing_sessions")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", sessionId);

  if (deleteError) {
    console.error("Delete session error:", deleteError);
    return { error: "세션 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/children/${session.child_id}`);
  revalidatePath("/reports");

  return { success: true };
}
