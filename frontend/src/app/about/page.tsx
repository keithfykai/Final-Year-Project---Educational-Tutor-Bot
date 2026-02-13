'use client';

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody, Button } from "@heroui/react";
import { FaGithub } from "react-icons/fa";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-24 space-y-24">

        {/* Header */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            About Eduble
          </h1>
          <p className="text-xl text-gray-300">
            A modern AI learning companion designed to make high-quality education
            more accessible, structured, and effective.
          </p>
        </section>

        {/* Core Sections */}
        <section className="grid gap-8">

          <InfoCard
            title="What is Eduble?"
            description="Eduble is an AI-powered educational assistant that provides instant,
            curriculum-aligned academic support tailored to each student's level —
            from PSLE to A Levels. It combines the latest in generative AI with
            rigorous educational standards to deliver personalized learning experiences."
          />

          <InfoCard
            title="Who is it for?"
            description="Eduble is built for students and exam candidates who want a reliable,
            on-demand learning companion to clarify concepts, reinforce understanding,
            and study more effectively. Whether you're preparing for your first major exam
            or pursuing advanced qualifications, Eduble adapts to your needs."
          />

          <InfoCard
            title="Why was it built?"
            description="This project was created to help bridge educational gaps by providing
            affordable, accessible academic support — especially for students who may
            not have access to private tuition. We believe that every student deserves
            quality education, and AI can help democratize access to expert-level tutoring."
          />

        </section>

        {/* Developer Section */}
        <section className="max-w-3xl mx-auto w-full">
          <h2 className="text-4xl font-bold mb-12 text-center">
            About the Developer
          </h2>
          
          <Card className="rounded-2xl bg-gray-900 border border-gray-800">
            <CardBody className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <Link
                    href="https://github.com/keithfykai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white hover:border-gray-400 transition">
                      <Image
                        src="/dp.jpg"
                        alt="Keith Lim"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                </div>

                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2">Keith Lim</h3>
                  <p className="text-gray-400 mb-4">
                    CS Final Year | Full-Stack Developer | AI Enthusiast
                  </p>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Passionate about leveraging technology to solve real-world educational challenges.
                  </p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <Button
                      as={Link}
                      href="https://github.com/keithfykai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full py-2 bg-white text-black"
                    >
                      <FaGithub className="text-lg" />
                      GitHub Profile
                    </Button>
                    
                    {/* <Button
                      as={Link}
                      href="https://github.com/keithfykai/Final-Year-Project---Educational-Tutor-Bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="bordered"
                      className="rounded-full border-white text-white"
                    >
                      Project Repo
                    </Button> */}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Technical Section */}
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">
            For the Curious
          </h2>
          <p className="text-gray-400 mb-6">
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
              rounded-full px-6 py-2
              bg-black border border-gray-300
              text-white font-medium
              shadow-sm hover:shadow-md
              hover:opacity-80 transition
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
    <Card
      className="
        rounded-2xl bg-black
        border border-gray-800
        hover:border-gray-600
        transition
      "
    >
      <CardBody className="p-8">
        <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
        <p className="text-gray-300 leading-relaxed text-lg">
          {description}
        </p>
      </CardBody>
    </Card>
  );
}
