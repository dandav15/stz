"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader, BrowserCodeReader } from "@zxing/browser";

function toItemRoute(scanned: string) {
  const raw = scanned.trim();

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith("/i/")) return u.pathname;
  } catch {}

  if (raw.startsWith("/i/")) return raw;

  return `/i/${encodeURIComponent(raw)}`;
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        const cams = await BrowserCodeReader.listVideoInputDevices();
        if (!mounted) return;

        setDevices(cams);

        const preferred =
          cams.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          cams[0]?.deviceId ||
          "";

        setDeviceId(preferred);
      } catch (e: any) {
        setErr(e?.message || "Could not access cameras.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

 const start = async () => {
  try {
    setErr("");
    if (!readerRef.current) readerRef.current = new BrowserQRCodeReader();
    if (!videoRef.current) throw new Error("Video not ready.");

    setScanning(true);

    // ✅ Prefer rear camera on mobile
    const result = await readerRef.current.decodeOnceFromConstraints(
      { video: { facingMode: { ideal: "environment" } } },
      videoRef.current
    );

    setScanning(false);
    router.push(toItemRoute(result.getText()));
  } catch (e: any) {
    setScanning(false);
    setErr(e?.message || "Failed to start scanner.");
  }
};

  return (
    <main className="page">
      <h1 className="frostCard">Scan QR</h1>

      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
          <div style={{ marginTop: 8, opacity: 0.85 }}>
            Camera access requires HTTPS on phones (or localhost).
          </div>
        </div>
      )}

      <div className="frostCard" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>Camera</div>

          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            style={{
              flex: "1 1 220px",
              border: "1px solid #334155",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 800,
            }}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Camera"}
              </option>
            ))}
          </select>

          <button
            onClick={start}
            className="cardLink"
            style={{ width: "auto", padding: "10px 14px", fontSize: 14 }}
            disabled={scanning}
          >
            {scanning ? "Scanning…" : "▶ Scan"}
          </button>
        </div>
      </div>

      <div className="frostCard" style={{ marginTop: 14 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid #334155",
            background: "rgba(255,255,255,0.02)",
          }}
        />
        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Scan a label → jumps straight to the item page.
        </div>
      </div>
    </main>
  );
}
