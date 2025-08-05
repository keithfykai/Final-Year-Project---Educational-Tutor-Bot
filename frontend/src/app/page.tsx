'use client';

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Hero />
        
        <div className="flex justify-center mt-8">
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 mb-5 bg-sky-600 text-white rounded hover:bg-sky-700 focus:outline-none focus:ring focus:ring-sky-500"
          >
            Start Chatting Now!
          </button>
        </div>

        <Features />
      </main>
    </>
  );
}
