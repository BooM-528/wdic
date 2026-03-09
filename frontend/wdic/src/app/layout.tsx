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
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
