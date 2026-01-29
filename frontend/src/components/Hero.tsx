import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section
      className="
        relative flex flex-col items-center justify-center text-center py-28
        animated-gradient
        bg-[linear-gradient(120deg,#e0f2fe,#f0f9ff,#e9d5ff,#cffafe)]
        dark:bg-[linear-gradient(120deg,#020617,#0f172a,#020617,#1e293b)]
      "
    >
      <div className="w-full max-w-4xl px-4">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/Eduble Logo Light.svg"
            alt="Hero Image"
            width={200}
            height={20}
            className=""
          />
          <h1 className="mx-6 text-5xl font-bold text-black dark:text-white">Eduble</h1>
        </div>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Learn Smarter with AI
        </h1>

        <p className="mt-6 text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
          Eduble is an AI-powered study assistant that helps students learn faster — from PSLE to A Levels — with clear, curriculum-aligned explanations. An intelligent tutor and built-in quizzes help reinforce understanding and track progress.
        </p>

        <div className="flex justify-center my-6 py-6">
          <button
            onClick={() => router.push("/chat")}
            className="
              inline-flex items-center gap-2
              rounded-full px-8 py-3
              bg-sky-600 hover:bg-sky-700
              text-white font-medium
              shadow-sm hover:shadow-md
              transition
            "
          >
            Start studying →
          </button>
        </div>
      </div>
    </section>
  );
}
