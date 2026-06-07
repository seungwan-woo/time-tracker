import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
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
    .select("*, families(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

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
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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

        {/* Family Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-muted px-2">가족 공간</h3>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="text-white">가족 이름</span>
              <span className="text-text-dim">{membership?.families?.name || "소속 없음"}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-white">나의 역할</span>
              <span className="text-text-dim">
                {membership?.role === "owner" ? "관리자" : "가족 구성원"}
              </span>
            </div>
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
