"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Spinner } from "@heroui/react";

type Level = "psle" | "o_level" | "a_level";

const SUBJECTS: Record<Level, Record<string, string>> = {
  psle: {
    science: "Science",
    mathematics: "Mathematics",
  },
  o_level: {
    combined_physics: "Combined Physics",
    combined_chemistry: "Combined Chemistry",
    combined_biology: "Combined Biology",
    pure_physics: "Pure Physics",
    pure_chemistry: "Pure Chemistry",
    pure_biology: "Pure Biology",
    add_math: "Additional Mathematics",
    elem_math: "Elementary Mathematics",
  },
  a_level: {
    h2_mathematics: "H2 Mathematics",
    h1_mathematics: "H1 Mathematics",
    h2_biology: "H2 Biology",
    h1_biology: "H1 Biology",
    h2_physics: "H2 Physics",
    h1_physics: "H1 Physics",
    h2_chemistry: "H2 Chemistry",
    h1_chemistry: "H1 Chemistry",
  },
};

type QuizQuestion = {
  id: number;
  topic: string;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

type QuizStartResponse = {
  level: Level;
  subject: string;
  num_questions: number;
  questions: QuizQuestion[];
};

function backendBaseUrl() {
  // Option A: set NEXT_PUBLIC_BACKEND_URL="http://localhost:8000" (or your server)
  // Option B: leave empty to use same-origin (e.g. if you proxy /llm)
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  if (!url) return ""; // same-origin: fetch("/llm/...")
  return url.replace(/\/+$/, ""); // remove trailing slash
}

export default function QuizPage() {
  const [level, setLevel] = useState<Level>("psle");
  const [subject, setSubject] = useState<string>("science");
  const [numQuestions, setNumQuestions] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [quiz, setQuiz] = useState<QuizStartResponse | null>(null);
  const [index, setIndex] = useState(0);

  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongTopics, setWrongTopics] = useState<string[]>([]);
  const [finalSummary, setFinalSummary] = useState<string>("");

  const subjectOptions = useMemo(() => SUBJECTS[level], [level]);

  const current = quiz?.questions?.[index] ?? null;
  const progressText = quiz ? `${index + 1} / ${quiz.num_questions}` : "";

  function resetRun() {
    setQuiz(null);
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setWrongTopics([]);
    setFinalSummary("");
    setError("");
  }

  async function startQuiz() {
    setLoading(true);
    setError("");
    setFinalSummary("");
    setQuiz(null);

    try {
      const base = backendBaseUrl();
      const res = await fetch(`${base}/llm/quiz/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          subject,
          num_questions: numQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to start quiz.");
      }

      setQuiz(data as QuizStartResponse);
      setIndex(0);
      setSelected(null);
      setSubmitted(false);
      setIsCorrect(null);
      setCorrectCount(0);
      setWrongTopics([]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function submitAnswer() {
    if (!current || !selected || submitted) return;

    const ok = selected === current.answer;
    setSubmitted(true);
    setIsCorrect(ok);

    if (ok) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongTopics((prev) => {
        const next = [...prev, current.topic].filter(Boolean);
        // de-dupe
        return Array.from(new Set(next));
      });
    }
  }

  async function finishQuiz() {
    if (!quiz) return;

    setLoading(true);
    setError("");

    try {
      const base = backendBaseUrl();
      const res = await fetch(`${base}/llm/quiz/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: quiz.level,
          subject: quiz.subject,
          total: quiz.num_questions,
          correct: correctCount,
          wrong_topics: wrongTopics,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate summary.");
      }

      setFinalSummary(data.summary ?? "");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    if (!quiz) return;

    const isLast = index >= quiz.num_questions - 1;
    if (isLast) return;

    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(null);
  }

  const showResults = quiz && index === quiz.num_questions - 1 && submitted;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Quiz Mode</h1>

          {!quiz && (
            <p className="text-gray-700 dark:text-gray-300">
              Quiz Mode lets you practise exactly what you need for your exams. Choose your level, subject,
              and number of questions, then test yourself with AI-generated MCQs that are aligned to your syllabus.
              At the end, you’ll receive a clear performance summary highlighting your strengths, mistakes, and topics
              to improve — helping you revise smarter and focus on what matters most.
            </p>
          )}

          <div className="text-sm"></div>
        </section>


        {/* Setup Card */}
        {!quiz && (
          <section
            className="
              rounded-2xl bg-white dark:bg-black
              border border-gray-200 dark:border-gray-800
              p-6 md:p-8 shadow-sm
            "
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-black dark:text-white"
                  value={level}
                  onChange={(e) => {
                    const nextLevel = e.target.value as Level;
                    setLevel(nextLevel);
                    const firstSubjectKey = Object.keys(SUBJECTS[nextLevel])[0];
                    setSubject(firstSubjectKey);
                  }}
                >
                  <option value="psle">PSLE</option>
                  <option value="o_level">O Level</option>
                  <option value="a_level">A Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-black dark:text-white"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {Object.entries(subjectOptions).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Questions (5–30)</label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(5, Math.min(30, Number(e.target.value))))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-3 py-2 text-black dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={startQuiz}
                disabled={loading}
                className="
                  inline-flex items-center justify-center gap-3
                  rounded-full px-6 py-2
                  bg-black dark:bg-white
                  text-white dark:text-black font-medium
                  shadow-sm hover:shadow-md
                  hover:opacity-80 transition disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="current" />
                    <span>Generating Questions...</span>
                  </>
                ) : (
                  "Start Quiz"
                )}
              </button>


              <span className="text-sm text-gray-600 dark:text-gray-400">
                Covers the syllabus broadly for the selected subject.
              </span>
            </div>
          </section>
        )}

        {/* Quiz Card */}
        {quiz && current && (
          <section
            className="
              rounded-2xl bg-white dark:bg-black
              border border-gray-200 dark:border-gray-800
              p-6 md:p-8 shadow-sm space-y-6
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">💬 {progressText}</div>
                <div className="mt-1 text-xs inline-flex rounded-full px-3 py-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800">
                  Topic: {current.topic}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                🎯 Score: <span className="font-semibold text-black dark:text-white">{correctCount}</span>
              </div>
            </div>

            <div className="text-lg font-semibold leading-relaxed">{current.question}</div>

            <div className="grid gap-3">
              {(["A", "B", "C", "D"] as const).map((k) => {
                const isPicked = selected === k;
                const showState = submitted;

                const correct = showState && k === current.answer;
                const wrongPick = showState && isPicked && k !== current.answer;

                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => !submitted && setSelected(k)}
                    className={[
                      "text-left rounded-2xl border px-4 py-3 transition",
                      "bg-white dark:bg-black",
                      "border-gray-200 dark:border-gray-800",
                      !submitted && "hover:border-gray-400 dark:hover:border-gray-600",
                      isPicked && !submitted && "ring-2 ring-gray-400/30 border-gray-400 dark:border-gray-600",
                      correct && "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20",
                      wrongPick && "border-red-300 dark:border-red-700 ring-2 ring-red-500/20",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isPicked}
                  >
                    <div className="flex gap-3">
                      <div className="font-semibold">{k}.</div>
                      <div className="text-gray-700 dark:text-gray-300">{current.options[k]}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {submitted && isCorrect !== null && (
              <div
                className={[
                  "rounded-2xl border px-4 py-3 text-sm",
                  isCorrect
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
                ].join(" ")}
              >
                {isCorrect ? (
                  <span>✅ Correct!</span>
                ) : (
                  <div className="space-y-1">
                    <div>
                      ❌ Not quite. Correct answer: <span className="font-semibold">{current.answer}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      {current.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!submitted ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selected}
                  className="
                    inline-flex items-center justify-center
                    rounded-full px-6 py-3
                    bg-black dark:bg-white
                    text-white dark:text-black font-medium
                    shadow-sm hover:shadow-md
                    hover:opacity-80 transition disabled:opacity-60
                  "
                >
                  Submit
                </button>
              ) : (
                <>
                  {index < quiz.num_questions - 1 ? (
                    <button
                      onClick={nextQuestion}
                      className="
                        inline-flex items-center justify-center
                        rounded-full px-6 py-3
                        bg-black dark:bg-white
                        text-white dark:text-black
                        font-medium shadow-sm hover:shadow-md
                        transition
                      "
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={finishQuiz}
                      disabled={loading}
                      className="
                        inline-flex items-center justify-center gap-3
                        rounded-full px-6 py-3
                        bg-black dark:bg-white
                        text-white dark:text-black
                        font-medium shadow-sm hover:shadow-md
                        transition disabled:opacity-60
                      "
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" color="current" />
                          <span>Generating Summary...</span>
                        </>
                      ) : (
                        "Finish Quiz"
                      )}
                    </button>
                  )}

                  <button
                    onClick={resetRun}
                    className="
                      inline-flex items-center justify-center
                      rounded-full px-6 py-3
                      border border-gray-200 dark:border-gray-800
                      bg-white dark:bg-black
                      text-gray-800 dark:text-gray-200
                      font-medium
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      transition
                    "
                  >
                    Restart
                  </button>
                </>
              )}
            </div>

            {/* End Summary */}
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {finalSummary && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black px-5 py-4 space-y-2">
                <div className="text-lg font-semibold">Your Results 📝</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  You scored{" "}
                  <span className="font-semibold text-black dark:text-white">
                    {correctCount}/{quiz.num_questions}
                  </span>
                  .
                </div>
                {wrongTopics.length > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Topics to brush up on:{" "}
                    <span className="font-medium">{wrongTopics.slice(0, 8).join(", ")}</span>
                    {wrongTopics.length > 8 ? "…" : ""}
                  </div>
                )}
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {finalSummary}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
