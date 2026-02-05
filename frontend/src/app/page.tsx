'use client';

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatWidget from "@/components/ChatWidget";
import { Card, CardBody } from "@heroui/react";

export default function HomePage() {
  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <Hero />
        <Features />
        
        {/* Vector Database Information Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto bg-black">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Powered by Curated Knowledge
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vector Database Card */}
            <Card className="rounded-2xl bg-black border border-gray-800">
              <CardBody className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Our Knowledge Base
                </h3>
                <p className="text-gray-300 mb-4">
                  Eduble leverages a sophisticated <span className="font-semibold">Vector Database</span> built from official syllabi and curated educational documents. This enables semantic search across millions of curriculum-aligned learning materials.
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span><strong>Official Syllabi:</strong> Singapore MOE PSLE, O-Level, A-Level, and International Baccalaureate (IB) curricula</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span><strong>Exam Papers:</strong> Past decade of exam questions and mark schemes for context</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">✓</span>
                    <span><strong>Study Resources:</strong> Vetted educational documents ensuring accuracy and relevance</span>
                  </li>
                </ul>
              </CardBody>
            </Card>

            {/* Technical Details Card */}
            <Card className="rounded-2xl bg-black border border-gray-800">
              <CardBody className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  How It Works
                </h3>
                <p className="text-gray-300 mb-4">
                  Our system uses advanced retrieval-augmented generation (RAG) to deliver answers grounded in verified sources.
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">1.</span>
                    <span><strong>Encoding:</strong> Documents are converted to semantic embeddings using OpenAI models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">2.</span>
                    <span><strong>Indexing:</strong> Embeddings are stored in a scalable vector database for instant retrieval</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 font-bold">3.</span>
                    <span><strong>Generation:</strong> GPT-4 uses retrieved context to craft accurate, curriculum-aligned responses</span>
                  </li>
                </ol>
              </CardBody>
            </Card>
          </div>

          {/* Data Validity Section */}
          <Card className="mt-12 rounded-2xl bg-black border border-gray-700">
            <CardBody className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Data Integrity & Validation
              </h3>
              <p className="text-gray-200 mb-6">
                All documents in our vector database undergo rigorous validation to ensure educational accuracy and relevance:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-bold text-white mb-2">📋 Source Verification</h4>
                  <p className="text-gray-300 text-sm">Only official MOE documents, approved curricula, and peer-reviewed educational materials</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">🔍 Quality Checks</h4>
                  <p className="text-gray-300 text-sm">Regular updates and validation against latest exam specifications and syllabus changes</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">📊 Accuracy Testing</h4>
                  <p className="text-gray-300 text-sm">Continuous benchmarking against actual exam questions ensures reliable, accurate responses</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      </main>
    </>
  );
}
