"use client";

import LoginPage from "@/app/login/page";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      // scrolling down → hide (after a small buffer)
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false);
      } else {
        // scrolling up → show
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ Now it’s safe to return early (hooks already ran)
  const hiddenRoutes = ["/", "/login"];

if (hiddenRoutes.includes(pathname)) return null;


  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <footer
      style={{
        height: 64,
        padding: "0 20px",
        backdropFilter: "blur(10px)",
        background: "rgba(11,18,32,0.88)",
        borderTop: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",

        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 220ms ease",
      }}
    >
      <button
        onClick={handleBack}
        title="Back"
        style={{
          border: "1px solid #334155",
          background: "rgba(255,255,255,0.04)",
          color: "#fff",
          borderRadius: 12,
          padding: "8px 14px",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back
      </button>
    </footer>
  );
}
