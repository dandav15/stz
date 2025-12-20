"use client";

import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();

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
        gridTemplateColumns: "96px 1fr 96px", // 👈 FIX
        alignItems: "center",
      }}
    >
      {/* Left */}
      <button
        onClick={() => router.push("/")}
        style={{
          width: 96,              // 👈 MATCHES grid
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
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 0.4,
        }}
      >
        STZ
      </div>

      {/* Right spacer */}
      <div style={{ width: 96 }} />
    </header>
  );
}
