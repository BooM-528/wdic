"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const isThai = language === "th";

  const toggleLanguage = () => {
    setLanguage(isThai ? "en" : "th");
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`relative flex items-center w-[72px] h-9 backdrop-blur-xl border rounded-full p-1 shadow-sm hover:shadow-md transition-all outline-none overflow-hidden group ${
        isThai ? "bg-rose-50/50 border-rose-100" : "bg-white/70 border-white/80"
      }`}
      aria-label="Toggle Language"
    >
      {/* Background Labels */}
      <div className="relative z-0 w-full flex justify-between px-2.5 text-[10px] font-black tracking-widest leading-none pointer-events-none">
        <span className={!isThai ? "opacity-0" : "text-gray-400"}>EN</span>
        <span className={isThai ? "opacity-0" : "text-gray-400"}>TH</span>
      </div>

      {/* Sliding Pill */}
      <div
        className={`absolute top-1 bottom-1 w-[32px] rounded-[14px] shadow-sm z-10 flex items-center justify-center transition-all duration-300 pointer-events-none ${
          isThai ? 'left-[36px] bg-[#D9114A] text-white ring-2 ring-[#D9114A]/20' : 'left-1 bg-gray-900 text-white ring-2 ring-gray-900/20'
        }`}
      >
        <span className="text-[10px] font-black leading-none tracking-widest">
          {isThai ? 'TH' : 'EN'}
        </span>
      </div>
    </button>
  );
}
