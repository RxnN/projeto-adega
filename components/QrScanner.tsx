"use client";

import { useEffect, useRef, useState } from "react";

const SCANNER_ELEMENT_ID = "qr-scanner-region";

export default function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (code: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<any>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            onResult(decodedText);
            html5Qrcode.stop().catch(() => {});
          },
          () => {
            // erro de leitura de um frame específico: ignorar, é normal
          }
        );
        if (!cancelled) setStarting(false);
      } catch (err: any) {
        if (!cancelled) {
          setStarting(false);
          setError(
            "Não foi possível acessar a câmera neste ambiente. Use a seleção manual do produto abaixo."
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => {}).finally(() => {
          s.clear?.();
        });
      }
    };
  }, [onResult]);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-vinho-800">Escanear QR Code do produto</h3>
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          Fechar
        </button>
      </div>
      {starting && <p className="text-sm text-gray-500">Iniciando câmera...</p>}
      {error && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">{error}</p>}
      <div id={SCANNER_ELEMENT_ID} className="w-full max-w-sm mx-auto" />
    </div>
  );
}
