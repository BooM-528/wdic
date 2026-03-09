"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close modal on outside click or Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsModalOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClick);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  function handleLogin() {
    setLoggedInUser("ProPlayer1");
    setIsModalOpen(false);
  }

  function handleUseGuest() {
    setLoggedInUser("Guest");
    setIsModalOpen(false);
  }

  return (
    <main className="relative min-h-screen bg-[#F8F9FA] text-gray-800 font-sans selection:bg-[#D9114A]/20">

      {/* 🌟 Dynamic Background Mesh Gradient Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden pb-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-rose-200 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-blue-100 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 bg-indigo-100 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar Container */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#D9114A] to-rose-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            W
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">WHY DID I CALL</span>
        </div>
        <div>
          {loggedInUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">{loggedInUser}</span>
              <Link href="/wdic" className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">
                Dashboard
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-800 text-sm font-bold shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.06)] hover:border-gray-300 transition-all text-center flex items-center gap-2"
            >
              เข้าสู่ระบบ <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-32 text-center flex flex-col items-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-rose-100 text-[#D9114A] text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
          Poker Analytics Platform ♠️♥️
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 max-w-4xl drop-shadow-sm">
          หยุด Call แบบไร้เหตุผล<br /> เริ่มวิเคราะห์เกมของคุณอย่าง<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9114A] to-rose-400">มือโปร</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mb-12 leading-relaxed">
          นำเข้า Hand History จาก <span className="text-gray-900 font-bold">Natural8</span> หรือแพลตฟอร์มโปรดของคุณ เพื่อค้นหาจุดอ่อน พัฒนา Win-Rate และเปลี่ยนคุณให้เป็นผู้เล่นที่เฉียบคมยิ่งขึ้น
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/wdic" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#D9114A] text-white font-black text-lg shadow-[0_8px_25px_rgba(217,17,74,0.3)] hover:shadow-[0_12px_35px_rgba(217,17,74,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
            เริ่มใช้งานฟรี
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-lg shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:bg-gray-50 hover:-translate-y-1 transition-all"
          >
            ดูตัวอย่าง Dashboard
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-gray-200/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">ฟีเจอร์หลักที่จะเปลี่ยนวิธีการเล่นของคุณ</h2>
          <p className="text-gray-500 font-medium">แอปพลิเคชันของเราออกแบบมาเพื่อผู้เล่นที่ต้องการพัฒนาตัวเองอย่างจริงจัง</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📥"
            title="นำเข้า History ง่ายดาย"
            desc="รองรับการวิเคราะห์ไฟล์ Hand History จาก Natural8 (.txt) และแพลตฟอร์มอื่นๆ ลากและวางไฟล์ลงในระบบก็พร้อมใช้งานทันที"
            color="from-blue-50 to-blue-100/50"
          />
          <FeatureCard
            icon="📊"
            title="วิเคราะห์สถิติเชิงลึก"
            desc="สรุปผลกำไร-ขาดทุนโดยรวม (Win/Loss), กราฟการเล่น และอัตราการชนะในแต่ละ Position อย่างละเอียด"
            color="from-rose-50 to-rose-100/50"
          />
          <FeatureCard
            icon="🔍"
            title="ค้นหา Leak System"
            desc="ระบบประมวลผลค้นหา 'จุดพร่อง' ของคุณ ช่วยไฮไลต์มือที่คุณ Call หรือ Fold ผิดพลาดบ่อยๆ เพื่อนำไปปรับปรุงแก้ไข"
            color="from-indigo-50 to-indigo-100/50"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.05)] text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-12">ขั้นตอนการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-[20%] left-1/6 right-1/6 h-0.5 bg-gray-200/50 z-0"></div>

            <StepItem num="1" title="Upload" desc="ดาวน์โหลด Hand History จากเว็บต้นทางแล้วลากมาวางในระบบ" />
            <StepItem num="2" title="Analyze" desc="ระบบจะประมวลผลข้อมูลหลายพันแฮนด์ของคุณในเสี้ยววินาที" />
            <StepItem num="3" title="Improve" desc="ตรวจสอบจุดผิดพลาด เจาะลึกรายมือ แล้วกลับไปบดขยี้คู่แข่ง!" />
          </div>

          <div className="mt-16">
            <Link href="/wdic" className="inline-flex px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-lg shadow-xl hover:bg-gray-800 hover:scale-105 transition-all">
              เข้าสู่ Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 w-full border-t border-gray-200/60 mt-auto bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="w-6 h-6 bg-[#D9114A] rounded text-white flex items-center justify-center text-xs">W</div>
            WHY DID I CALL
          </div>
          <div className="text-sm font-semibold text-gray-400">
            © {new Date().getFullYear()} ArnisongK — Analytics for Serious Poker Players.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 transition-opacity duration-300"
          aria-hidden={!isModalOpen}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            className="relative bg-white/95 backdrop-blur-2xl border border-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl transform transition-all duration-300 animate-in zoom-in-95"
          >
            {/* Close icon */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="w-16 h-16 bg-[#D9114A]/10 text-[#D9114A] rounded-2xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">เข้าสู่แดชบอร์ด</h3>
            <p className="text-gray-500 font-medium mb-8">วิเคราะห์ Hand History ส่วนตัวของคุณ</p>

            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={handleLogin}
                className="w-full py-3.5 rounded-xl bg-[#D9114A] text-white font-bold hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-500/30 active:scale-[0.98]"
              >
                Login with Provider
              </button>

              <button
                onClick={handleUseGuest}
                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Trial as Guest
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// --- Sub-components for Layout --- //

function FeatureCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-8 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 group">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center relative z-10 group">
      <div className="w-14 h-14 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-xl font-black text-gray-900 shadow-sm mb-6 group-hover:border-[#D9114A] group-hover:text-[#D9114A] group-hover:scale-110 transition-all duration-300">
        {num}
      </div>
      <h4 className="text-lg font-black text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-500 font-medium text-sm px-4">{desc}</p>
    </div>
  );
}
