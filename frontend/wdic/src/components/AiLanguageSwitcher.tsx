"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function AiLanguageSwitcher() {
  const { aiLanguage, setAiLanguage, t } = useLanguage();

  const isThai = aiLanguage === "th";

  const toggleAiLanguage = () => {
    setAiLanguage(isThai ? "en" : "th");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
        {t("ai_language")}
      </span>
      <button
        onClick={toggleAiLanguage}
        className={`relative flex items-center w-[72px] h-8 backdrop-blur-xl border rounded-full p-1 shadow-sm hover:shadow-md transition-all outline-none overflow-hidden group ${
          isThai ? "bg-rose-50/70 border-rose-200" : "bg-white/70 border-white/80"
        }`}
        aria-label="Toggle AI Language"
        title={`AI response language: ${isThai ? "Thai" : "English"}`}
      >
        {/* Background Labels */}
        <div className="relative z-0 w-full flex justify-between px-2.5 text-[9px] font-black tracking-widest leading-none pointer-events-none">
          <span className={!isThai ? "opacity-0" : "text-gray-400"}>EN</span>
          <span className={isThai ? "opacity-0" : "text-gray-400"}>TH</span>
        </div>

        {/* Sliding Pill */}
        <div
          className={`absolute top-1 bottom-1 w-[30px] rounded-[12px] shadow-sm z-10 flex items-center justify-center transition-all duration-300 pointer-events-none ${
            isThai
              ? "left-[34px] bg-[#D9114A] text-white ring-2 ring-[#D9114A]/20"
              : "left-1 bg-indigo-600 text-white ring-2 ring-indigo-600/20"
          }`}
        >
          <span className="text-[9px] font-black leading-none tracking-widest">
            {isThai ? "TH" : "EN"}
          </span>
        </div>
      </button>
    </div>
  );
}
