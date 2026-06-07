import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ChildCard from "@/components/ChildCard";
import { getTodayDateString, formatDateDisplay } from "@/lib/date/utils";
import type { Database } from "@/types/database";

type ActiveSession = Pick<
  Database["public"]["Tables"]["wearing_sessions"]["Row"],
  "id" | "child_id" | "start_at"
>;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's family
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  const familyId = membership.family_id;

  // Get family details
  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .single();

  // Get children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("family_id", familyId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const todayStr = getTodayDateString();

  // Get today's total minutes from view
  const { data: dailySummaries } = await supabase
    .from("daily_wearing_summary")
    .select("*")
    .eq("family_id", familyId)
    .eq("report_date", todayStr);

  // Get active sessions
  const { data: activeSessions } = await supabase
    .from("wearing_sessions")
    .select("id, child_id, start_at")
    .eq("family_id", familyId)
    .eq("status", "active")
    .is("deleted_at", null);

  const summariesByChild =
    dailySummaries?.reduce((acc, curr) => {
      acc[curr.child_id] = curr.total_minutes;
      return acc;
    }, {} as Record<string, number>) || {};

  const activeSessionByChild =
    activeSessions?.reduce((acc, curr) => {
      acc[curr.child_id] = curr;
      return acc;
    }, {} as Record<string, ActiveSession>) || {};

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />

      <main className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-medium text-text-dim">
              {family?.name}
            </h1>
            <div className="text-xs bg-surface-elevated px-2 py-1 rounded-full text-text-dim border border-border">
              오늘
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatDateDisplay(todayStr)}
          </p>
        </header>

        {/* Tracker Cards */}
        <div className="space-y-6">
          {children?.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              activeSession={activeSessionByChild[child.id] || null}
              todayTotalMinutes={summariesByChild[child.id] || 0}
            />
          ))}

          {(!children || children.length === 0) && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-text-muted mb-4">등록된 대상이 없습니다.</p>
              <a
                href="/settings"
                className="text-primary hover:text-primary-light font-medium transition-colors"
              >
                설정에서 대상 추가하기
              </a>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
