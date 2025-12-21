"use client";

import { useEffect, useRef, useState } from "react";
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

  // Used to ignore late results after cancel
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopCameraStream();
      tryRuntimeReset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryRuntimeReset = () => {
    try {
      // Some versions expose reset() at runtime but typings may not.
      (readerRef.current as any)?.reset?.();
    } catch {}
  };

  const stopCameraStream = () => {
    try {
      const v = videoRef.current;
      const stream = (v?.srcObject as MediaStream | null) ?? null;
      stream?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    } catch {}
  };

  const startScan = async () => {
    try {
      setErr("");
      cancelledRef.current = false;

      setShowCamera(true);
      setScanning(true);

      if (!readerRef.current) readerRef.current = new BrowserQRCodeReader();
      if (!videoRef.current) throw new Error("Video not ready.");

      const result = await readerRef.current.decodeOnceFromConstraints(
        { video: { facingMode: { ideal: "environment" } } }, // rear camera preferred
        videoRef.current
      );

      // If user cancelled while promise was pending, ignore result
      if (cancelledRef.current) return;

      setScanning(false);
      setShowCamera(false);

      router.push(toItemRoute(result.getText()));
    } catch (e: any) {
      if (cancelledRef.current) return; // ignore errors caused by cancel
      setScanning(false);
      setErr(e?.message || "Failed to start scanner.");
      setShowCamera(true);
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    setScanning(false);
    setShowCamera(false);

    // stop the camera + try to cancel decoder
    stopCameraStream();
    tryRuntimeReset();
  };

  return (
    <main className="page">
      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
          <div style={{ marginTop: 8, opacity: 0.85 }}>
            Tip: camera access needs HTTPS on phones (or localhost).
          </div>
        </div>
      )}

      {!showCamera && (
        <div className="buttonStack" style={{ marginTop: 18 }}>
          <button
            onClick={startScan}
            className="cardLink"
            style={{
              textAlign: "center",
              cursor: "pointer",
              padding: "22px 18px",
              fontSize: 22,
              fontWeight: 950,
              borderRadius: 18,
            }}
            disabled={scanning}
          >
            {scanning ? "Starting…" : "📷 Scan QR"}
          </button>

          <div className="frostCard" style={{ opacity: 0.85 }}>
            Tap “Scan QR”, point at the label, and it will open the item page instantly.
          </div>
        </div>
      )}

      {showCamera && (
        <div className="buttonStack" style={{ marginTop: 18 }}>
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
              {scanning ? "Scanning…" : "Camera ready."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={startScan}
              className="cardLink"
              style={{
                textAlign: "center",
                cursor: "pointer",
                padding: "16px 14px",
                fontSize: 18,
                fontWeight: 950,
                borderRadius: 16,
              }}
              disabled={scanning}
            >
              {scanning ? "Scanning…" : "▶ Scan QR"}
            </button>

            <button
              onClick={cancel}
              className="cardLink"
              style={{
                textAlign: "center",
                cursor: "pointer",
                padding: "16px 14px",
                fontSize: 18,
                fontWeight: 950,
                borderRadius: 16,
                color: "#f87171",
                borderColor: "#7f1d1d",
              }}
            >
              ✖ Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
