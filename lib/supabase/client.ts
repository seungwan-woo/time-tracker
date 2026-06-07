"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function getSupabaseBrowserEnv(): {
  url: string;
  publishableKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase browser environment variables are missing.");
  }

  return { url, publishableKey };
}

export function createClient() {
  const { url, publishableKey } = getSupabaseBrowserEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
