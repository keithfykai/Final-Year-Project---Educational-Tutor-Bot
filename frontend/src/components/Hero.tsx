import Image from "next/image";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";

export default function Hero() {
  const router = useRouter();
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        top: `${Math.floor(6 + Math.random() * 88)}%`,
        left: `${Math.floor(4 + Math.random() * 92)}%`,
        size: `${(Math.random() * 2 + 1) * 3}px`,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2.5,
      })),
    []
  );

  return (
    <section
      className="
        relative flex flex-col items-center justify-center text-center py-20 md:py-28
        bg-black
        border-b border-gray-800
        overflow-hidden
      "
    >
      {/* Dynamic background: gradients, blobs, particles, subtle grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(0,0,0,0)_55%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />

        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          animate={{ x: [0, -60, 0], y: [0, -50, 0], scale: [1, 1.25, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-80px] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-0">
          {dots.map((dot, idx) => (
            <motion.span
              key={idx}
              className="absolute rounded-full bg-white/60"
              style={{
                top: dot.top,
                left: dot.left,
                width: dot.size,
                height: dot.size,
              }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.2, 0.4] }}
              transition={{
                duration: dot.duration,
                delay: dot.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-4xl px-4 relative z-10">
        <div className="flex flex-row items-center justify-center mb-6">
          <Image
            src="/Eduble Logo Light.svg"
            alt="Eduble Logo"
            width={200}
            height={20}
          />
          <h1 className="mx-6 text-5xl font-bold text-white">Eduble</h1>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Learn Smarter with AI
        </h2>

        <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-300">
          Eduble is an AI-powered study assistant that helps students learn faster — from PSLE to A Levels — with clear, curriculum-aligned explanations. An intelligent tutor and built-in quizzes help reinforce understanding and track progress.
        </p>

        <div className="flex justify-center my-8 pt-4">
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
        </div>
      </div>
    </section>
  );
}
