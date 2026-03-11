"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "th";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  aiLanguage: Language;
  setAiLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th"); // Default to TH as per user's current content
  const [aiLanguage, setAiLanguageState] = useState<Language>("th");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "th")) {
      setLanguageState(saved);
    }
    const savedAi = localStorage.getItem("ai_language") as Language;
    if (savedAi && (savedAi === "en" || savedAi === "th")) {
      setAiLanguageState(savedAi);
    } else if (saved && (saved === "en" || saved === "th")) {
      // fallback: match UI language on first use
      setAiLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const setAiLanguage = (lang: Language) => {
    setAiLanguageState(lang);
    localStorage.setItem("ai_language", lang);
  };

  const t = (key: string) => {
    const { translations } = require("./translations");
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, aiLanguage, setAiLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
