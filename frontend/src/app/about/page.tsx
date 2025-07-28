import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex flex-col justify-center min-h-screen w-full px-20 bg-sky-50 dark:bg-slate-900 text-left">
      <h1 className="text-4xl font-bold mb-6">About Educational Tutor Bot</h1>

      <section className="mb-6 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-2">What is this app?</h2>
        <p>
          Educational Tutor Bot is an AI-powered platform designed to help students get instant, personalized academic support based on their level and curriculum.
        </p>
      </section>

      <section className="mb-6 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-2">Who is this for?</h2>
        <p>
          This app is targeted primarily at teenagers and students preparing for exams, ranging from PSLE to A Levels, who want a convenient, accessible way to improve their learning.
        </p>
      </section>

      <section className="mb-6 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-2">Why did we build it?</h2>
        <p>
          We created Educational Tutor Bot to make education more accessible, especially for students who cannot afford traditional tuition. Our mission is to empower learners through affordable, AI-driven academic assistance.
        </p>
      </section>

      <section className="max-w-4xl">
        <h2 className="text-2xl font-semibold mb-2">Check out the code</h2>
        <p>
          The project is open source and available on{' '}
          <Link
            href="https://github.com/keithfykai/Final-Year-Project---Educational-Tutor-Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            GitHub
          </Link>.
        </p>
      </section>

      <h1 className="text-4xl font-bold my-6">Nerdy Stuff</h1>
    </main>
  );
}
