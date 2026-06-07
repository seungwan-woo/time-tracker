import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import InviteMemberForm from "@/components/InviteMemberForm";
import {
  FamilyForm,
  ProfileForm,
  ResetDataForm,
  TrackerManager,
} from "@/components/SettingsForms";
import { logout } from "@/actions/logout";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile and family
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const { data: family } = membership
    ? await supabase
        .from("families")
        .select("name")
        .eq("id", membership.family_id)
        .single()
    : { data: null };

  const { data: members } = membership
    ? await supabase
        .from("family_members")
        .select("id, user_id, role, created_at")
        .eq("family_id", membership.family_id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: invites } = membership
    ? await supabase
        .from("invite_codes")
        .select("id, invited_email, expires_at, used_at")
        .eq("family_id", membership.family_id)
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(3)
    : { data: [] };

  const { data: trackers } = membership
    ? await supabase
        .from("children")
        .select("id, name, target_minutes_per_day")
        .eq("family_id", membership.family_id)
        .eq("active", true)
        .order("display_order", { ascending: true })
    : { data: [] };

  const isOwner = membership?.role === "owner";

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold">설정</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Profile Section */}
        <section className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xl font-bold text-primary-light">
                {profile?.display_name?.charAt(0) || user.email?.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{profile?.display_name || "사용자"}</h2>
            <p className="text-sm text-text-dim">{user.email}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">내 정보</h3>
          <div className="glass rounded-2xl p-4">
            <ProfileForm displayName={profile?.display_name ?? null} />
          </div>
        </section>

        {/* Family Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">가족 공간</h3>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="text-white">가족 이름</span>
              <span className="text-text-dim">{family?.name || "소속 없음"}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-white">나의 역할</span>
              <span className="text-text-dim">
                {isOwner ? "관리자" : "가족 구성원"}
              </span>
            </div>
            <div className="p-4 border-t border-border">
              <FamilyForm familyName={family?.name ?? null} canEdit={isOwner} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">대상 관리</h3>
          <div className="glass rounded-2xl p-4">
            <TrackerManager trackers={trackers ?? []} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">공동 관리</h3>
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">참여 중</span>
                <span className="text-white font-medium">
                  {members?.length ?? 0}명
                </span>
              </div>
              <div className="space-y-2">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="bg-surface/60 border border-border rounded-xl px-3 py-2 flex items-center justify-between"
                  >
                    <span className="text-sm text-text-dim">
                      {member.user_id === user.id ? user.email : member.user_id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {member.role === "owner" ? "관리자" : "구성원"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <InviteMemberForm />

            {invites && invites.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-text-dim">대기 중인 초대</p>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex justify-between gap-3 text-xs text-text-muted"
                  >
                    <span className="truncate">
                      {invite.invited_email ?? "이메일 없음"}
                    </span>
                    <span>
                      {new Date(invite.expires_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* App Info Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">데이터 초기화</h3>
          <div className="glass rounded-2xl p-4">
            <ResetDataForm canReset={isOwner} />
          </div>
        </section>

        {/* App Info Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">앱 정보</h3>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="text-white">버전</span>
              <span className="text-text-dim">1.0.0</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full bg-surface border border-border hover:bg-surface-hover text-danger font-bold py-4 px-4 rounded-xl active:scale-[0.98] transition-all text-center"
            >
              로그아웃
            </button>
          </form>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
