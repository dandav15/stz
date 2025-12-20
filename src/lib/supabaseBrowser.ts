import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser(remember = true) {
  const isBrowser = typeof window !== "undefined";

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: remember,
        autoRefreshToken: remember,
        // ✅ only access storage in the browser
        storage: isBrowser ? (remember ? localStorage : sessionStorage) : undefined,
      },
    }
  );
}
