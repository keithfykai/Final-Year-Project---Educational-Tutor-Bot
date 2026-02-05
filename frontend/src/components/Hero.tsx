import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";

export default function Hero() {
  const router = useRouter();

  return (
    <section
      className="
        relative flex flex-col items-center justify-center text-center py-24 md:py-32
        bg-black
        border-b border-gray-800
        overflow-hidden
      "
    >
      {/* Animated background with blurry white lines */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            </filter>
          </defs>
          <g filter="url(#blur)" stroke="currentColor" strokeWidth="0.3" fill="none">
            {/* Animated lines */}
            <motion.path
              d="M 0,20 Q 25,18 50,20 T 100,20"
              className="text-white"
              animate={{ d: ["M 0,20 Q 25,18 50,20 T 100,20", "M 0,24 Q 25,22 50,24 T 100,24", "M 0,20 Q 25,18 50,20 T 100,20"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M 0,40 Q 25,38 50,40 T 100,40"
              className="text-white"
              animate={{ d: ["M 0,40 Q 25,38 50,40 T 100,40", "M 0,44 Q 25,42 50,44 T 100,44", "M 0,40 Q 25,38 50,40 T 100,40"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M 0,60 Q 25,58 50,60 T 100,60"
              className="text-white"
              animate={{ d: ["M 0,60 Q 25,58 50,60 T 100,60", "M 0,64 Q 25,62 50,64 T 100,64", "M 0,60 Q 25,58 50,60 T 100,60"] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
        </svg>
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
              px-8 py-4
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
