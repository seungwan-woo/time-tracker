import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { formatKST, formatDuration } from "@/lib/date/utils";

export default async function ReportsPage() {
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

  // Get children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("family_id", familyId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen pb-24 relative flex items-center justify-center">
        <p className="text-text-muted">아이 정보가 없습니다.</p>
        <BottomNav />
      </div>
    );
  }

  // Fetch last 7 days of daily summaries
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDateStr = formatKST(sevenDaysAgo, "yyyy-MM-dd");

  const { data: recentSummaries } = await supabase
    .from("daily_wearing_summary")
    .select("*")
    .eq("family_id", familyId)
    .gte("report_date", startDateStr)
    .order("report_date", { ascending: true });

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold">착용 리포트</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-8">
        {children.map((child) => {
          const childSummaries = recentSummaries?.filter((s) => s.child_id === child.id) || [];
          
          // Fill missing days with 0
          const chartData = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = formatKST(d, "yyyy-MM-dd");
            const label = formatKST(d, "E"); // 요일
            const summary = childSummaries.find((s) => s.report_date === dateStr);
            const minutes = summary?.total_minutes || 0;
            const percentage = Math.min((minutes / child.target_minutes_per_day) * 100, 100);
            
            chartData.push({
              dateStr,
              label,
              minutes,
              percentage,
            });
          }

          const weekTotal = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
          const weekAvg = Math.round(weekTotal / 7);

          return (
            <div key={child.id} className="glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  {child.name}
                </h2>
                <div className="text-right">
                  <p className="text-xs text-text-dim">최근 7일 평균</p>
                  <p className="font-bold text-primary-light">{formatDuration(weekAvg)}/일</p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-2 mt-8 mb-4 px-2">
                {chartData.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip-like value display on top of bar */}
                    <span className="text-[10px] font-mono text-text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(data.minutes / 60)}h
                    </span>
                    
                    <div className="w-full relative flex justify-center h-32 bg-surface-elevated/30 rounded-t-lg overflow-hidden">
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out ${
                          data.percentage >= 100 ? "bg-success" : "bg-primary"
                        }`}
                        style={{ height: `${data.percentage}%` }}
                      >
                        {/* Shimmer effect for filled bars */}
                        {data.percentage > 0 && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                        )}
                      </div>
                    </div>
                    
                    <span className={`text-xs mt-2 font-medium ${
                      idx === 6 ? "text-primary-light font-bold" : "text-text-dim"
                    }`}>
                      {data.label}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="bg-surface/50 rounded-xl p-3">
                  <p className="text-xs text-text-dim mb-1">하루 목표</p>
                  <p className="font-bold">{formatDuration(child.target_minutes_per_day)}</p>
                </div>
                <div className="bg-surface/50 rounded-xl p-3">
                  <p className="text-xs text-text-dim mb-1">이번 주 누적</p>
                  <p className="font-bold">{formatDuration(weekTotal)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
