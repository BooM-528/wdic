import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Anuphan } from "next/font/google";
const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
});


export const metadata: Metadata = {
  title: 'WDIC',
  description: 'WDIC',
  openGraph: {
    title: 'WDIC',
    description: 'WDIC',
    url: 'https://wdic.arnisongk.com',
    siteName: 'WDIC',
    type: 'website',
  },
};

import { LanguageProvider } from "@/lib/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppBackground from "@/components/AppBackground";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anuphan.variable} antialiased`}
      >
        <LanguageProvider>
          <div className="relative min-h-screen flex flex-col bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20">
            <AppBackground />
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1 relative z-10 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
