"use client";

import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  backTo?: string; // optional override
};

export default function BackHeader({ title, backTo = "/items" }: Props) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <button
        onClick={() => router.push(backTo)}
        aria-label="Back"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: "1px solid #334155",
          background: "rgba(255,255,255,0.04)",
          color: "#fff",
          fontSize: 18,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ←
      </button>

      {title && (
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
          }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}
