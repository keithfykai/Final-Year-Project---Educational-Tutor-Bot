import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-24 space-y-24">

        {/* Header */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            About Eduble
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A modern AI learning companion designed to make high-quality education
            more accessible, structured, and effective.
          </p>
        </section>

        {/* Core Sections */}
        <section className="grid gap-12">

          <InfoCard
            title="What is Eduble?"
            description="Eduble is an AI-powered educational assistant that provides instant,
            curriculum-aligned academic support tailored to each student’s level —
            from PSLE to A Levels."
          />

          <InfoCard
            title="Who is it for?"
            description="Eduble is built for students and exam candidates who want a reliable,
            on-demand learning companion to clarify concepts, reinforce understanding,
            and study more effectively."
          />

          <InfoCard
            title="Why was it built?"
            description="This project was created to help bridge educational gaps by providing
            affordable, accessible academic support — especially for students who may
            not have access to private tuition."
          />

        </section>

        {/* Technical Section */}
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">
            For the Curious
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Eduble is built as part of a Final-Year Project and is fully open-source.
            If you’re interested in the technical details or implementation, you can
            explore the codebase below.
          </p>

          <Link
            href="https://github.com/keithfykai/Final-Year-Project---Educational-Tutor-Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              rounded-full px-6 py-3
              bg-sky-600 hover:bg-sky-700
              text-white font-medium
              shadow-sm hover:shadow-md
              transition
            "
          >
            View on GitHub →
          </Link>
        </section>

      </div>
    </main>
  );
}

/* ---------- Helper Component ---------- */

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        rounded-2xl bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        p-8 shadow-sm
      "
    >
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
