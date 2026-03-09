'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface JoinByQRCodeProps {
  shareCode: string;
}

export default function JoinByQRCode({ shareCode }: JoinByQRCodeProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gifting/events/${shareCode}/join`
      : '';

  useEffect(() => {
    // detect mobile
    const ua = navigator.userAgent.toLowerCase();
    setIsMobile(/iphone|android|mobile/.test(ua));

    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 240,
        margin: 1,
      }).then(setQr);
    }
  }, [joinUrl]);

  return (
    <div
      className="
        mt-6 flex flex-col items-center gap-3
        rounded-2xl border border-dashed
        bg-gray-50 p-4
      "
    >
      {qr && (
        <img
          src={qr}
          alt="Join by QR Code"
          className="w-36 h-36 rounded-lg bg-white p-2 shadow"
        />
      )}

      <div className="text-center space-y-1">
        <p className="text-sm font-medium">
          สแกนเพื่อเข้าร่วม
        </p>
        <p className="text-xs text-gray-500">
          📱
        </p>
      </div>
    </div>
  );
}
