"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function SharePage() {
  const { t } = useLanguage();
  const [qrSrc, setQrSrc] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUrl = window.location.origin;
    setUrl(currentUrl);

    const generateQR = async () => {
      try {
        // 1. Create a canvas to draw the QR
        const canvas = document.createElement("canvas");
        const size = 1000; // High resolution

        // 2. Generate QR with High Error Correction (to allow logo overlay)
        await QRCode.toCanvas(canvas, currentUrl, {
          width: size,
          margin: 4,
          errorCorrectionLevel: 'H',
          version: 10, // High version for more detail (more dots)
          color: {
            dark: "#D9114A",
            light: "#ffffff",
          },
        });

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // 3. Load Logo
          const logo = new Image();
          logo.src = "/logo.png";
          await new Promise((resolve) => {
            logo.onload = resolve;
          });

          // 4. Draw Logo in center
          const logoSize = size * 0.22; // Logo size relative to QR
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          // Calculate background size (Quiet zone)
          const padding = size * 0.025; // 2.5% of total size
          const bgSize = logoSize + padding * 2;
          const bgX = (size - bgSize) / 2;
          const bgY = (size - bgSize) / 2;
          const borderRadius = size * 0.05; // 50px if size is 1000

          // Save context for shadow and clipping
          ctx.save();

          // Draw Shadow for the logo container
          ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = size * 0.04;
          ctx.shadowOffsetY = size * 0.015;

          // Draw white rounded rectangle background (Quiet zone)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(bgX, bgY, bgSize, bgSize, borderRadius);
          ctx.fill();

          // Add a very subtle border stroke for definition
          ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
          ctx.lineWidth = size * 0.005;
          ctx.stroke();

          ctx.restore();

          // Draw the actual logo centered on top
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        }

        setQrSrc(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error(err);
      }
    };

    generateQR();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 pt-24 md:pt-32 pb-40 relative z-10 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl"
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 md:-top-24 -right-20 md:-right-24 w-48 md:w-64 h-48 md:h-64 bg-rose-100 rounded-full blur-[80px] md:blur-[100px] opacity-60"></div>
        <div className="absolute -bottom-20 md:-bottom-24 -left-20 md:-left-24 w-48 md:w-64 h-48 md:h-64 bg-indigo-100 rounded-full blur-[80px] md:blur-[100px] opacity-60"></div>

        <div className="relative bg-white/80 backdrop-blur-3xl border border-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden text-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-rose-50/20 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Header */}
            <h1 className="text-4xl md:text-6xl font-[1000] text-[#D9114A] mb-6 tracking-tighter leading-tight px-2">
              WDIC
            </h1>
            <div className="h-1.5 w-12 md:w-16 bg-gradient-to-r from-[#D9114A] to-rose-400 rounded-full mx-auto mb-8 md:mb-10"></div>

            <p className="text-sm md:text-lg text-gray-500 font-bold mb-8 md:mb-12 max-w-xs md:max-w-md mx-auto leading-relaxed opacity-80">
              {t("share_page_desc")}
            </p>

            {/* QR Code Container */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative w-full aspect-square max-w-[280px] md:max-w-[320px] mx-auto bg-white p-4 md:p-6 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white flex items-center justify-center mb-10 md:mb-12 overflow-hidden group/qr"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D9114A]/5 to-transparent opacity-0 group-hover/qr:opacity-100 transition-opacity duration-500"></div>
              {qrSrc ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={qrSrc}
                  alt="QR Code"
                  className="w-full h-full object-contain relative z-10"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-rose-100 border-t-[#D9114A] animate-spin"></div>
              )}
            </motion.div>

            {/* URL Display & Action */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 flex flex-col items-center gap-4 group/url hover:bg-white hover:border-rose-100 hover:shadow-xl transition-all duration-300">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{t("website_link")}</span>
                <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight break-all px-2 md:px-4">
                  {url.replace(/^https?:\/\//, '')}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="mt-2 flex items-center gap-2 px-8 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-black text-gray-600 hover:text-[#D9114A] hover:border-rose-200 transition-all shadow-sm active:scale-95"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 text-green-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        Copied!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        Copy Link
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
