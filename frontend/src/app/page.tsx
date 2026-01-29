'use client';

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatWidget from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <>
      {/* Page content */}
      <main className="min-h-screen bg-slate-500 text-gray-900">
        <Hero />
        <Features />
      </main>

      {/* Floating chatbot (overlay) */}
      <ChatWidget />
    </>
  );
}
