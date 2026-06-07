import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatDateDisplay, formatTimeRange } from "@/lib/date/utils";
import BottomNav from "@/components/BottomNav";

export default async function ChildDetailPage(props: { params: Promise<{ childId: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: child } = await supabase
    .from("children")
    .select("*, families(name, default_target_minutes)")
    .eq("id", params.childId)
    .single();

  if (!child) {
    redirect("/dashboard");
  }

  // Check family membership
  const { data: isMember } = await supabase.rpc("is_family_member", {
    target_family_id: child.family_id,
  });

  if (!isMember) {
    redirect("/dashboard");
  }

  // Get all sessions (active and closed), ordered by start_at descending
  // Limiting to recent 50 for MVP
  const { data: sessions } = await supabase
    .from("wearing_sessions")
    .select("*")
    .eq("child_id", child.id)
    .is("deleted_at", null)
    .order("start_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="app-header-inner gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 active:scale-95 text-text-dim hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold flex-1 text-center pr-8">
            {child.name}의 기록
          </h1>
        </div>
      </header>

      <main className="app-container grid gap-6 pt-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="glass rounded-2xl p-6 text-center lg:sticky lg:top-20 lg:self-start">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-primary-light">
              {child.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-xl font-bold">{child.name}</h2>
          <p className="text-sm text-text-dim mt-1">
            하루 목표: {formatDuration(child.target_minutes_per_day)}
          </p>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold mb-4 px-2">최근 기록</h3>
          
          <div className="space-y-3">
            {sessions?.map((session) => (
              <div 
                key={session.id} 
                className={`glass-elevated rounded-xl p-4 border-l-4 ${
                  session.status === "active" ? "border-l-active" : "border-l-success"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-muted">
                      {formatDateDisplay(session.report_date)}
                    </span>
                    <span className="text-lg font-bold mt-1 tracking-tight">
                      {formatTimeRange(session.start_at, session.end_at)}
                    </span>
                  </div>
                  <div className="text-right">
                    {session.status === "active" ? (
                      <span className="bg-active/20 text-active-light text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                        진행 중
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-success-light">
                        {formatDuration(session.duration_minutes || 0)}
                      </span>
                    )}
                  </div>
                </div>
                {session.note && (
                  <p className="text-sm text-text-dim mt-2 bg-surface/50 p-2 rounded-lg">
                    {session.note}
                  </p>
                )}
              </div>
            ))}

            {(!sessions || sessions.length === 0) && (
              <div className="text-center py-12 text-text-dim">
                기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
