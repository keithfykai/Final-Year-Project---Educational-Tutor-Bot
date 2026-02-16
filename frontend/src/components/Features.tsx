import { FaClipboardCheck, FaBolt, FaBookOpen } from "react-icons/fa";
import React from "react";
import { Card, CardBody } from "@heroui/react";

export default function Features() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto bg-black">
      <h2 className="text-4xl font-bold text-center mb-16 text-white">
        Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
    <Card className="rounded-2xl bg-gray-800/30 border border-gray-800 hover:border-gray-400 transition">
      <CardBody className="p-8">
        <div className="text-4xl mb-6 text-white">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </CardBody>
    </Card>
  );
}