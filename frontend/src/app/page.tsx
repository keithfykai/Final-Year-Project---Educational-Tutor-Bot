'use client';

import Hero from "@/components/Hero";
import Features from "@/components/Features";

export default function HomePage() {
  return (
    <>
      <main className="min-h-screen bg-white text-gray-900">
        <Hero />
        <Features />
      </main>
    </>
  );
}
