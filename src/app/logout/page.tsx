"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();


  useEffect(() => {
    supabase.auth.signOut().then(() => router.push("/login"));
  }, []);

  return <div style={{ padding: 20 }}>Signing out…</div>;
}
