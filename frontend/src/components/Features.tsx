import { FaClipboardCheck, FaBolt, FaBookOpen } from "react-icons/fa";
import React from "react";

export default function Features() {
  return (
    <section className="py-16 px-6 mx-auto bg-indigo-50 dark:bg-slate-800">
      <h2 className="text-3xl font-semibold mb-8 text-center text-slate-800 dark:text-white">
        Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
        <FeatureCard
          icon={<FaClipboardCheck />}
          title="Exam-Oriented Help"
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
          description="Covers a wide range of subjects from math to humanities."
        />
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-indigo-100 dark:bg-slate-700 rounded-xl shadow-md flex items-center gap-6">
      <div className="flex-shrink-0 text-5xl text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">{title}</h3>
        <p className="text-slate-700 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}