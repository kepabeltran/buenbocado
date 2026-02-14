"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (code: string) => void;
  onClose: () => void;
};

export default function QRScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scanningRef = useRef(true);

  useEffect(() => {
    let animId: number;
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Lazy load barcode detector or fallback
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          
          async function scan() {
            if (stopped || !scanningRef.current || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const value = barcodes[0].rawValue;
                if (value) {
                  scanningRef.current = false;
                  setScanning(false);
                  onScan(value);
                  return;
                }
              }
            } catch {}
            animId = requestAnimationFrame(scan);
          }
          animId = requestAnimationFrame(scan);
        } else {
          // Fallback: load jsQR from CDN
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
          script.onload = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            function scanFrame() {
              if (stopped || !scanningRef.current || !video || !ctx) return;
              canvas!.width = video.videoWidth;
              canvas!.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
              const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height);
              if (code?.data) {
                scanningRef.current = false;
                setScanning(false);
                onScan(code.data);
                return;
              }
              animId = requestAnimationFrame(scanFrame);
            }
            animId = requestAnimationFrame(scanFrame);
          };
          document.head.appendChild(script);
        }
      } catch (err: any) {
        setError("No se pudo acceder a la cámara. Comprueba los permisos.");
      }
    }

    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(animId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onScan]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 20,
        maxWidth: 400, width: "90%", textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Escanear QR del cliente</h3>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 8,
              padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>

        {error ? (
          <div style={{ padding: 20, color: "#dc2626", fontSize: 14 }}>{error}</div>
        ) : (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", display: "block", borderRadius: 12 }}
              playsInline
              muted
            />
            {scanning && (
              <div style={{
                position: "absolute", inset: "20%",
                border: "3px solid #22c55e", borderRadius: 12,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            )}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <p style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
          {scanning ? "Apunta la cámara al código QR del cliente" : "¡Código detectado!"}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
