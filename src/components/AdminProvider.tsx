"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type AdminContextValue = {
  isAdmin: boolean;
  loading: boolean;
};

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  loading: true,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const supabase = supabaseBrowser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) {
          if (alive) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (alive) {
          setIsAdmin(prof?.role === "admin");
          setLoading(false);
        }
      } catch {
        if (alive) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    })();

    // keep it updated on login/logout
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // re-run quick check
      (async () => {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        setIsAdmin(prof?.role === "admin");
        setLoading(false);
      })();
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
