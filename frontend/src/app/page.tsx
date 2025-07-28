'use client';

import Hero from "@/components/Hero";
import Features from "@/components/Features";

export default function HomePage() {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Hero />
        <Features />
      </main>
    </>
  );
}
