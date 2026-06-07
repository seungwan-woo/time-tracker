"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionState = {
  error?: string;
  success?: string;
};

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
});

const familySchema = z.object({
  familyName: z.string().trim().min(1, "공간 이름을 입력해주세요.").max(50),
});

const trackerSchema = z.object({
  trackerId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "대상 이름을 입력해주세요.").max(50),
  targetMinutes: z.coerce.number().int().min(1).max(1440),
});

const trackerIdSchema = z.object({
  trackerId: z.string().uuid(),
});

async function getUserFamily() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, membership: null };
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return { supabase, user, membership };
}

function revalidateSettings() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function updateProfile(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.displayName?.[0] };
  }

  const { supabase, user } = await getUserFamily();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Update profile error:", error);
    return { error: "프로필 수정에 실패했습니다." };
  }

  revalidateSettings();
  return { success: "프로필을 저장했습니다." };
}

export async function updateFamily(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const parsed = familySchema.safeParse({
    familyName: formData.get("familyName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.familyName?.[0] };
  }

  const { supabase, membership } = await getUserFamily();

  if (!membership) {
    return { error: "공간 정보를 찾을 수 없습니다." };
  }

  if (membership.role !== "owner") {
    return { error: "관리자만 공간 정보를 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("families")
    .update({
      name: parsed.data.familyName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.family_id);

  if (error) {
    console.error("Update family error:", error);
    return { error: "공간 이름 수정에 실패했습니다." };
  }

  revalidateSettings();
  return { success: "공간 이름을 저장했습니다." };
}

export async function upsertTracker(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const trackerId = formData.get("trackerId") || undefined;
  const parsed = trackerSchema.safeParse({
    trackerId,
    name: formData.get("name"),
    targetMinutes: formData.get("targetMinutes"),
  });

  if (!parsed.success) {
    return { error: "대상 이름과 목표 시간을 확인해주세요." };
  }

  const { supabase, membership } = await getUserFamily();

  if (!membership) {
    return { error: "공간 정보를 찾을 수 없습니다." };
  }

  if (!parsed.data.trackerId) {
    const { count, error: countError } = await supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("family_id", membership.family_id)
      .eq("active", true);

    if (countError) {
      console.error("Count trackers error:", countError);
      return { error: "대상 수를 확인하지 못했습니다." };
    }

    if ((count ?? 0) >= 3) {
      return { error: "대상은 최대 3개까지 추가할 수 있습니다." };
    }
  }

  if (parsed.data.trackerId) {
    const { error } = await supabase
      .from("children")
      .update({
        name: parsed.data.name,
        target_minutes_per_day: parsed.data.targetMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.trackerId)
      .eq("family_id", membership.family_id);

    if (error) {
      console.error("Update tracker error:", error);
      return { error: "대상 수정에 실패했습니다." };
    }
  } else {
    const { data: existing } = await supabase
      .from("children")
      .select("display_order")
      .eq("family_id", membership.family_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("children").insert({
      family_id: membership.family_id,
      name: parsed.data.name,
      target_minutes_per_day: parsed.data.targetMinutes,
      display_order: (existing?.display_order ?? 0) + 1,
    });

    if (error) {
      console.error("Create tracker error:", error);
      return { error: "대상 추가에 실패했습니다." };
    }
  }

  revalidateSettings();
  return { success: "대상 정보를 저장했습니다." };
}

export async function deactivateTracker(formData: FormData) {
  const parsed = trackerIdSchema.safeParse({
    trackerId: formData.get("trackerId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, membership } = await getUserFamily();

  if (!membership) {
    return;
  }

  await supabase
    .from("children")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.trackerId)
    .eq("family_id", membership.family_id);

  revalidateSettings();
}

export async function resetFamilyData(formData: FormData) {
  const confirmText = formData.get("confirmText");
  const { supabase, user, membership } = await getUserFamily();

  if (!user || !membership || membership.role !== "owner") {
    return;
  }

  if (confirmText !== "RESET") {
    return;
  }

  await supabase
    .from("wearing_sessions")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("family_id", membership.family_id)
    .is("deleted_at", null);

  revalidateSettings();
}
