import Image from "next/image";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-20 bg-sky-50 dark:bg-slate-900">
      <div className="w-full max-w-4xl">
        <Image
          src="https://images.unsplash.com/photo-1633111148061-a976bbe6f193?q=80&w=1740&auto=format&fit=crop"
          alt="Hero Image"
          width={900}
          height={500}
          className="mx-auto mb-8 rounded-xl shadow-lg"
        />
        <h1 className="text-4xl font-bold mb-4 text-slate-800 dark:text-white">
          Supercharge your learning with AI!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Our Educational Tutor Bot helps students succeed by providing instant,
          intelligent help based on your level and curriculum. We support a wide range of 
          subjects and examinations, from PSLE to A Levels.
        </p>
      </div>
    </section>
  );
}
