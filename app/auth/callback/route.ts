import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a family
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist (fallback for trigger)
          await supabase.from("profiles").insert({
            id: user.id,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              null,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || null,
          });
        }

        // Check if user belongs to a family
        const { data: membership } = await supabase
          .from("family_members")
          .select("family_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (!membership) {
          // Check if there's an invite code in the next param
          if (next.startsWith("/invite/")) {
            return NextResponse.redirect(`${origin}${next}`);
          }
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login if code is missing or invalid
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
