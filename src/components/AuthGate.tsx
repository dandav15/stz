"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const PUBLIC_ROUTES = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      const isPublic = PUBLIC_ROUTES.some((p) =>
        pathname === p || pathname.startsWith(p + "/")
      );

      if (!user && !isPublic) {
        router.replace("/login");
        return;
      }

      if (user && pathname === "/login") {
        router.replace("/");
        return;
      }

      if (alive) setChecked(true);
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      alive = false;
      sub?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!checked) return null; // prevents flicker

  return <>{children}</>;
}
