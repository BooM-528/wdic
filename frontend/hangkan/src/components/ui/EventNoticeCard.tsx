'use client';

import { useState } from 'react';

interface EventNoticeCardProps {
  shareCode: string;
  mode?: 'random' | 'chain';
}

export default function EventNoticeCard({
  shareCode,
  mode = 'random',
}: EventNoticeCardProps) {
  const [copied, setCopied] = useState(false);

  const eventUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gifting/events/${shareCode}`
      : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl border border-primary/10
        bg-gradient-to-br from-primary/5 via-white to-white
        px-5 py-4
      "
    >
      {/* subtle accent */}
      <div className="absolute top-0 left-0 h-full w-1 bg-primary/40" />

      <div className="space-y-3">
        {/* algorithm */}
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-medium text-gray-900">🎁 ระบบการสุ่ม</span>
          <br />
          สุ่มแบบ <span className="font-medium">ทีละรอบ</span>{' '}
          {mode === 'chain' ? (
            <>
              โดย <span className="font-medium">คนรับรอบก่อน</span>{' '}
              จะเป็นคนให้ในรอบถัดไป
            </>
          ) : (
            <>
              เลือกคนให้ 1 คน และคนรับ 1 คน
            </>
          )}
          <br />
          ทุกคนจะให้และรับได้เพียงครั้งเดียว และไม่มีใครได้ของตัวเอง
        </p>

        {/* actions */}
        <div className="flex justify-end">
          <button
            onClick={handleCopy}
            className="
              inline-flex items-center gap-2
              rounded-full px-4 py-1.5
              text-xs font-medium
              border border-primary/20
              bg-white
              text-primary
              shadow-sm
              hover:bg-primary/5
              active:scale-[0.96]
              transition
            "
          >
            {copied ? (
              <>
                ✓ คัดลอกแล้ว
              </>
            ) : (
              <>
                🔗 คัดลอกลิงก์
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
