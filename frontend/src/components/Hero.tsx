"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { BeamsBackground } from "@/components/ui/beams-background";

export default function Hero() {
  const router = useRouter();

  return (
    <BeamsBackground className="border-b border-gray-800 min-h-0">
      <section className="flex flex-col items-center justify-center text-center py-20 md:py-28">
        <div className="w-full max-w-4xl px-4">
          <motion.div
            className="flex flex-row items-center justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/Eduble Logo Light.svg"
              alt="Eduble Logo"
              width={200}
              height={20}
            />
            <h1 className="mx-6 text-5xl font-bold text-white">Eduble</h1>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Learn Smarter with AI
          </motion.h2>

          <motion.p
            className="mt-4 text-lg max-w-2xl mx-auto text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Eduble is an AI-powered study assistant that helps students learn faster — from PSLE to A Levels — with clear, curriculum-aligned explanations. An intelligent tutor and built-in quizzes help reinforce understanding and track progress.
          </motion.p>

          <motion.div
            className="flex justify-center my-8 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Button
              onClick={() => router.push("/chat")}
              className="
                rounded-full
                bg-white
                text-black
                font-semibold text-base
                px-6 py-3
                hover:opacity-80 transition
              "
            >
              Start studying →
            </Button>
          </motion.div>
        </div>
      </section>
    </BeamsBackground>
  );
}
