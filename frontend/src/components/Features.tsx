import { FaClipboardCheck, FaBolt, FaBookOpen } from "react-icons/fa";
import React from "react";

export default function Features() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl pb-6 text-center font-semibold mb-5 text-slate-900">
        Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <FeatureCard
          icon={<FaClipboardCheck />}
          title="Curriculum Aligned"
          description="Explanations are grounded in official syllabi and exam requirements. Every answer stays within scope, so you learn exactly what matters for your assessments."
        />

        <FeatureCard
          icon={<FaBolt />}
          title="Fast & Accurate"
          description="Get clear, reliable answers in seconds, not minutes. Designed to minimise errors while keeping explanations concise and easy to follow."
        />

        <FeatureCard
          icon={<FaBookOpen />}
          title="Multi-Subject Support"
          description="Supports multiple subjects across PSLE, O Levels, and A Levels. Switch topics seamlessly without changing tools or context."
        />
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
  <div className="
    p-8 rounded-2xl
    bg-white dark:bg-slate-800
    border border-slate-200 dark:border-slate-700
    shadow-sm hover:shadow-md
    transition
  ">
      <div className="text-3xl pb-4 text-sky-600 dark:text-sky-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-md text-slate-700 dark:text-slate-300">{description}</p>
    </div>
  );
}