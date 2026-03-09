"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';


export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null); // ใส่ชื่อเมื่อ login สำเร็จ
  const modalRef = useRef<HTMLDivElement | null>(null);

  // ปิด modal เมื่อกดภายนอกหรือกด Esc
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
      document.body.style.overflow = "hidden"; // หยุด scroll ขณะ modal เปิด (mobile friendly)
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // ทดลอง function login/guest
  function handleLogin() {
    // แทนที่ด้วย flow จริงของคุณ (oauth, form, ฯลฯ)
    setLoggedInUser("Boom");
    setIsModalOpen(false);
  }

  function handleUseGuest() {
    setLoggedInUser("Guest");
    setIsModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-soft-gray text-dark flex flex-col items-center px-6 py-10 gap-8">
      {/* Header / Hero */}
      <header className="w-full max-w-4xl flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">ArnisongK</h1>
          <p className="text-sm text-secondary-dark/70">เรื่องเล่น ๆ เราจริงจัง</p>
        </div>

        {/* User area */}
        {/* <div className="flex items-center gap-3">
          {loggedInUser ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {loggedInUser[0]?.toUpperCase()}
              </div>
              <div className="text-sm text-secondary-dark/80">{loggedInUser}</div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-full bg-primary text-white text-sm shadow-sm hover:opacity-70"
              >
                Login
              </button>
            </div>
          )}
        </div> */}
      </header>

      {/* Feature cards */}
      <section className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/gifting">
          <article
            className="group bg-white rounded-3xl p-8 sm:p-10 border border-soft-gray shadow-md
                 cursor-pointer transform transition duration-200
                 hover:-translate-y-2 hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-primary mb-2">
              🎁 จับของขวัญ
            </h2>
            <p className="text-secondary-dark/70">
              จับของขวัญแบบไม่ซ้ำ จัดงานง่ายกว่าเดิม
            </p>
          </article>
        </Link>

        <Link href="https://hantang.arnisongk.com">
          <article
            className="group bg-white rounded-3xl p-8 sm:p-10 border border-soft-gray shadow-md
                 cursor-pointer transform transition duration-200
                 hover:-translate-y-2 hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-primary mb-2">
              💸 เครื่องมือหารเงิน
            </h2>
            <p className="text-secondary-dark/70">
              หารค่าใช้จ่ายแบบอัตโนมัติ จบในหน้าเดียว
            </p>
          </article>
        </Link>

        <Link href="/wdic">
          <article
            className="group bg-white rounded-3xl p-8 sm:p-10 border border-soft-gray shadow-md
                 cursor-pointer transform transition duration-200
                 hover:-translate-y-2 hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-primary mb-2">
              ♠️♥️ ถอดแฮนด์ Poker ♦️♣️
            </h2>
            <p className="text-secondary-dark/70">
              Why did I CALL!!
            </p>
          </article>
        </Link>
      </section>

      <footer className="w-full max-w-4xl text-sm text-secondary-dark/60 text-center mt-6">
        © {new Date().getFullYear()} ArnisongK — สนุกสนาน
      </footer>

      {/* Modal (rendered conditionally to avoid layout errors) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          aria-hidden={!isModalOpen}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-xl transform transition-all duration-200 scale-100"
          >
            {/* Close icon */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-secondary-dark/50 hover:text-secondary-dark transition"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold text-primary mb-3">เข้าสู่ระบบ</h3>
            <p className="text-secondary-dark/70 mb-6">ต้องการเข้าสู่ระบบหรือใช้แบบ Guest?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogin}
                className="w-full py-2 rounded-xl bg-primary text-white font-medium hover:opacity-70 transition"
              >
                Login
              </button>

              <button
                onClick={handleUseGuest}
                className="w-full py-2 text-center text-secondary font-medium hover:opacity-70 transition"
              >
                Guest
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
