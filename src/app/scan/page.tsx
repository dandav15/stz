"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/browser";

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

  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState("");

  const startScan = async () => {
    try {
      setErr("");
      setShowCamera(true);
      setScanning(true);

      if (!readerRef.current) readerRef.current = new BrowserQRCodeReader();
      if (!videoRef.current) throw new Error("Video not ready.");

      // ✅ Rear camera preferred (mobile)
      const result = await readerRef.current.decodeOnceFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current
      );

      setScanning(false);
      setShowCamera(false);

      router.push(toItemRoute(result.getText()));
    } catch (e: any) {
      setScanning(false);
      setErr(e?.message || "Failed to start scanner.");
      // keep camera visible so they can try again (or cancel)
      setShowCamera(true);
    }
  };

  const cancel = () => {
    try {
      // Some versions expose reset(), some don’t in TS.
      // We can safely stop by clearing the video stream.
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    } catch {}

    setScanning(false);
    setShowCamera(false);
  };

  return (
    <main className="page">
      <h1 className="frostCard">Scan QR</h1>

      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
          <div style={{ marginTop: 8, opacity: 0.85 }}>
            Tip: camera access needs HTTPS on phones (or localhost).
          </div>
        </div>
      )}

      {!showCamera && (
        <div className="buttonStack" style={{ marginTop: 14 }}>
          <button
            onClick={startScan}
            className="cardLink"
            style={{ textAlign: "center", cursor: "pointer" }}
            disabled={scanning}
          >
            {scanning ? "Starting…" : "📷 Scan"}
          </button>

          <div className="frostCard" style={{ opacity: 0.85 }}>
            Tap scan, point at the label, and it will jump straight to the item page.
          </div>
        </div>
      )}

      {showCamera && (
        <div className="buttonStack" style={{ marginTop: 14 }}>
          <div className="frostCard">
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
              {scanning ? "Scanning…" : "Camera ready — tap Scan again if needed."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={startScan}
              className="cardLink"
              style={{ textAlign: "center", cursor: "pointer" }}
              disabled={scanning}
            >
              {scanning ? "Scanning…" : "▶ Scan"}
            </button>

            <button
              onClick={cancel}
              className="cardLink"
              style={{
                textAlign: "center",
                cursor: "pointer",
                color: "#f87171",
                borderColor: "#7f1d1d",
              }}
              disabled={scanning}
            >
              ✖ Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
