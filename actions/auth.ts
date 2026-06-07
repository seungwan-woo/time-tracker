"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return redirect("/login?error=이메일과 비밀번호를 입력해주세요");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?error=로그인 실패: 이메일 또는 비밀번호를 확인해주세요");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
      
    if (!membership) {
      redirect("/onboarding");
    }
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return redirect("/login?error=이메일과 비밀번호를 입력해주세요");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return redirect("/login?error=회원가입 실패: " + error.message);
  }

  // Supabase의 "Confirm email"이 켜져있다면 이메일 인증이 필요하다는 메시지를 보여줄 수 있습니다.
  // 꺼져있다면 자동 로그인됩니다.
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    redirect("/onboarding");
  } else {
    return redirect("/login?error=회원가입 완료! 이메일을 확인하여 인증해주세요. (또는 Supabase에서 Confirm Email을 끄시면 바로 로그인됩니다)");
  }
}
