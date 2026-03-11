"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="relative z-10 w-full border-t border-gray-200/60 mt-auto bg-white/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="WDIC Logo" className="w-full h-full object-contain" />
          </div>
          {t("brand_name")}
        </div>
        <div className="text-sm font-semibold text-gray-400">
          © {new Date().getFullYear()} ArnisongK — Analytics for Serious Poker Players.
        </div>
      </div>
    </footer>
  );
}
