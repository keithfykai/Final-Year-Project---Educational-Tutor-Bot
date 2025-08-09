import { FaClipboardCheck, FaBolt, FaBookOpen } from "react-icons/fa";
import React from "react";

export default function Features() {
  return (
    <section className="py-16 px-6 mx-auto bg-blue-50 dark:bg-slate-800">
      <h2 className="text-3xl pb-6 text-center font-semibold mb-5 text-slate-800 dark:text-white">
        ✨ Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
        <FeatureCard
          icon={<FaClipboardCheck />}
          title="Curriculum Aligned"
          description="Tailored assistance aligned with your syllabus and past papers."
        />
        <FeatureCard
          icon={<FaBolt />}
          title="Fast & Accurate"
          description="Get concise and accurate answers to your questions instantly."
        />
        <FeatureCard
          icon={<FaBookOpen />}
          title="Multi-Subject Support"
          description="Covers a wide range of Exams from PSLE to A Level."
        />
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-sky-100 dark:bg-slate-700 rounded-xl shadow-md flex flex-col items-start gap-4">
      <div className="text-4xl text-blue-600 dark:text-indigo-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-md text-slate-700 dark:text-slate-300">{description}</p>
    </div>
  );
}