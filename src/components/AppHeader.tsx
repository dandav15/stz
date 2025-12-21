"use client";

import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    // TODO: put your logout logic here (Supabase signOut, etc.)
    // then redirect:
    router.push("/login");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 64,
        padding: "0 20px",
        backdropFilter: "blur(10px)",
        background: "rgba(11,18,32,0.88)",
        borderBottom: "1px solid #334155",
        display: "grid",
        gridTemplateColumns: "96px 1fr 96px",
        alignItems: "center",
      }}
    >
      {/* Left */}
      <button
        onClick={() => router.push("/")}
        style={{
          width: 96,
          border: "1px solid #334155",
          background: "rgba(255,255,255,0.04)",
          color: "#fff",
          borderRadius: 14,
          padding: "10px 0",
          fontWeight: 900,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        ← Menu
      </button>

      {/* Center */}
      <div
        style={{
          textAlign: "center",
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: 0.4,
          color: "#fff",
        }}
      >
        STZ
      </div>

      {/* Right (Logout) */}
      <button
        onClick={handleLogout}
        title="Log out"
        style={{
          width: 96,
          border: "1px solid rgba(239,68,68,0.35)", // red border
          background: "rgba(239,68,68,0.10)",       // subtle red fill
          color: "#fecaca",                         // light red text
          borderRadius: 14,
          padding: "10px 0",
          fontWeight: 900,
          fontSize: 15,
          cursor: "pointer",
          transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.18)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.55)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.10)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        ⎋ Logout
      </button>
    </header>
  );
}
