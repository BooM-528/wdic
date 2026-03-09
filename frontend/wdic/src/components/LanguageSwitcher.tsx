"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl p-1 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          language === "en"
            ? "bg-gray-900 text-white shadow-lg"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("th")}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          language === "th"
            ? "bg-[#D9114A] text-white shadow-lg shadow-rose-100"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        }`}
      >
        TH
      </button>
    </div>
  );
}
