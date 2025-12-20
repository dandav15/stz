"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        const supabase = supabaseBrowser(true);
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
    >
      Logout
    </button>
  );
}
