"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const onboardingSchema = z.object({
  familyName: z.string().min(1, "가족 이름을 입력해주세요").max(50),
  child1Name: z.string().min(1, "첫째 아이 이름을 입력해주세요").max(50),
  child1Target: z.coerce.number().min(60).max(1440),
  child2Name: z.string().max(50).optional(),
  child2Target: z.coerce.number().min(60).max(1440).optional(),
});

type OnboardingState = {
  error?: string;
  fieldErrors?: z.inferFlattenedErrors<typeof onboardingSchema>["fieldErrors"];
};

export async function submitOnboarding(
  _prevState: OnboardingState | null,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "인증에 실패했습니다. 다시 로그인해주세요." };
  }

  // 2. Validate form data
  const child2NameRaw = formData.get("child2Name") as string;
  const child2Name = child2NameRaw ? child2NameRaw.trim() : undefined;

  const validatedFields = onboardingSchema.safeParse({
    familyName: formData.get("familyName"),
    child1Name: formData.get("child1Name"),
    child1Target: formData.get("child1Target"),
    child2Name: child2Name,
    child2Target: child2Name ? formData.get("child2Target") : undefined,
  });

  if (!validatedFields.success) {
    return {
      error: "입력값을 확인해주세요.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  // 3. Create family
  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({
      name: data.familyName,
      created_by: user.id,
      default_target_minutes: data.child1Target,
    })
    .select("id")
    .single();

  if (familyError || !family) {
    console.error("Family creation error:", familyError);
    return { error: "가족 공간 생성 중 오류가 발생했습니다." };
  }

  // 4. Add user as family owner
  const { error: memberError } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    console.error("Family member creation error:", memberError);
    // Ideally we would rollback the family creation here, but keeping it simple for MVP
    return { error: "가족 구성원 등록 중 오류가 발생했습니다." };
  }

  // 5. Add children
  const childrenToInsert = [
    {
      family_id: family.id,
      name: data.child1Name,
      target_minutes_per_day: data.child1Target,
      display_order: 1,
    },
  ];

  if (data.child2Name && data.child2Target) {
    childrenToInsert.push({
      family_id: family.id,
      name: data.child2Name,
      target_minutes_per_day: data.child2Target,
      display_order: 2,
    });
  }

  const { error: childrenError } = await supabase
    .from("children")
    .insert(childrenToInsert);

  if (childrenError) {
    console.error("Children creation error:", childrenError);
    return { error: "아이 정보 등록 중 오류가 발생했습니다." };
  }

  // 6. Redirect to dashboard
  redirect("/dashboard");
}
