import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex flex-col py-20 dark:bg-gradient-to-b dark:from-black dark:via-black dark:to-black bg-gradient-to-b from-white via-sky-200 to-white min-h-screen w-full px-20 text-left">
      <section className="mb-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">What is Eduble?</h1>
        <p>
          Educational Tutor Bot is an AI-powered platform designed to help students get instant, 
          personalized academic support based on their level and curriculum.
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
          I created Educational Tutor Bot to make education more accessible, 
          especially for students who cannot afford traditional tuition. The hope 
          is to empower learners through affordable, AI-driven academic 
          assistance.
        </p>
      </section>

      <div className="">
        <h1 className="text-4xl font-bold my-6">Nerdy Stuff</h1>

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
      </div>

    </main>
  );
}
