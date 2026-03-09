'use client';

import { useRef } from 'react';
import Button from './Button';

type ImageUploadProps = {
  label?: string;
  value?: File | null;
  onChange: (file: File | null, preview: string | null) => void;
};

export default function ImageUpload({
  label = 'รูปภาพ',
  value,
  onChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-secondary-dark">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          const preview = file ? URL.createObjectURL(file) : null;
          onChange(file, preview);
        }}
      />

      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        {value ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}
      </Button>

      {value && (
        <img
          src={URL.createObjectURL(value)}
          alt="preview"
          className="mt-2 h-40 w-full rounded-xl border object-cover"
        />
      )}
    </div>
  );
}
