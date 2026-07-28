"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface QrScannerProps {
  onScan: (customerId: string) => void;
  onError: (message: string) => void;
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const handled = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    let active = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (handled.current) return;
          const value = text.trim();
          if (!UUID_PATTERN.test(value)) return;
          handled.current = true;
          onScan(value);
        },
        undefined
      )
      .then(() => {
        active = true;
      })
      .catch(() => {
        onError(
          "Could not open the camera. Check permissions, or look the customer up by phone instead."
        );
      });

    return () => {
      if (active) {
        scanner.stop().catch(() => {});
      }
    };
    // Intentionally run once: the scanner owns the camera for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="qr-reader" className="overflow-hidden rounded-2xl" />;
}
