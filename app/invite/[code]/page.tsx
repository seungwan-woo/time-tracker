import { redeemInvite } from "@/actions/invite";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InvitePage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ code }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${code}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <main className="w-full max-w-sm glass rounded-2xl p-6 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary-light flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">초대 수락</h1>
          <p className="text-sm text-text-muted">
            이 계정으로 Time Tracker 공간에 참여합니다.
          </p>
        </div>
        {searchParams.error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3">
            <p className="text-danger text-sm">
              만료되었거나 이미 사용된 초대입니다.
            </p>
          </div>
        )}
        <form action={redeemInvite}>
          <input type="hidden" name="code" value={code} />
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-light active:scale-[0.98] transition-all"
          >
            참여하기
          </button>
        </form>
      </main>
    </div>
  );
}
