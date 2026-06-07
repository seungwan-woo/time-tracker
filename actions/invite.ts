"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
});

type InviteState = {
  error?: string;
  inviteUrl?: string;
  mailtoUrl?: string;
};

function createInviteCode(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

async function getAppOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host = requestHeaders.get("host");

  if (host) {
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL?.replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}

export async function createInvite(
  _prevState: InviteState | null,
  formData: FormData
): Promise<InviteState> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return { error: "먼저 공간을 만들어주세요." };
  }

  const code = createInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("invite_codes").insert({
    family_id: membership.family_id,
    code,
    invited_email: parsed.data.email,
    created_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Create invite error:", error);
    return { error: "초대 링크 생성에 실패했습니다." };
  }

  const inviteUrl = `${await getAppOrigin()}/invite/${code}`;
  const subject = encodeURIComponent("Time Tracker 초대");
  const body = encodeURIComponent(
    `Time Tracker 공간에 초대받았습니다.\n\n아래 링크로 접속해 참여해주세요.\n${inviteUrl}`
  );

  revalidatePath("/settings");

  return {
    inviteUrl,
    mailtoUrl: `mailto:${parsed.data.email}?subject=${subject}&body=${body}`,
  };
}

export async function redeemInvite(formData: FormData) {
  const code = formData.get("code") as string;

  if (!code) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${code}`);
  }

  const { data, error } = await supabase.rpc("redeem_invite_code", {
    invite_code: code,
  });

  if (error || !data) {
    console.error("Redeem invite error:", error);
    redirect(`/invite/${code}?error=invalid`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/dashboard");
}
