import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser(remember = true) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: remember,
        autoRefreshToken: remember,
        storage: remember ? localStorage : sessionStorage,
      },
    }
  );
}
