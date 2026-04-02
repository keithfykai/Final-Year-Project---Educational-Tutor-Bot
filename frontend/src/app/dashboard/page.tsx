"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getAuthClient } from "../../../firebase/firebaseClient";
import { motion, type Variants } from "framer-motion";
import { MessageSquare, BookOpen, Map, LogOut, ChevronRight, Home, UserCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { useProfile } from "@/hooks/useProfile";

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LEVEL_LABELS: Record<string, string> = {
  psle: "PSLE",
  o_level: "O Level",
  a_level: "A Level",

};

function ProfileStatsCard() {
  const { profile, loading } = useProfile();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 to-black/30 p-5 flex flex-col sm:flex-row sm:items-center gap-5"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0">
        <UserCircle size={22} />
      </div>

      {/* Stats */}
      <div className="flex-grow min-w-0 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your Learner Profile</p>

        {loading ? (
          <div className="flex gap-4">
            {[80, 64, 96].map((w, i) => (
              <div key={i} className={`h-4 rounded-full bg-gray-800 animate-pulse`} style={{ width: w }} />
            ))}
          </div>
        ) : !profile?.educationalLevel && !profile?.subjectsStudying?.length && !profile?.learningGoals?.length ? (
          <p className="text-sm text-gray-500">No profile set up yet. Fill it in to personalise your experience.</p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {/* Education Level */}
            {profile?.educationalLevel && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Level</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  {LEVEL_LABELS[profile.educationalLevel] ?? profile.educationalLevel}
                </span>
              </div>
            )}

            {/* Subjects */}
            {profile?.subjectsStudying?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-500">Subjects</span>
                {profile.subjectsStudying.slice(0, 4).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {s}
                  </span>
                ))}
                {profile.subjectsStudying.length > 4 && (
                  <span className="text-xs text-gray-600">+{profile.subjectsStudying.length - 4}</span>
                )}
              </div>
            )}

            {/* Learning Goals */}
            {profile?.learningGoals?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-500">Goals</span>
                {profile.learningGoals.slice(0, 2).map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {g}
                  </span>
                ))}
                {profile.learningGoals.length > 2 && (
                  <span className="text-xs text-gray-600">+{profile.learningGoals.length - 2}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit button */}
      <Link
        href="/profile"
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white text-black text-sm font-medium hover:opacity-80 transition"
      >
        Edit Profile
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuthClient();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) router.replace("/signin");
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    const auth = getAuthClient();
    await fetch("/api/sessionLogout", { method: "POST" });
    await signOut(auth);
    router.push("/");
  };

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Student";

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const features = [
    {
      href: "/chat",
      icon: MessageSquare,
      title: "Chat",
      subtitle: "AI Tutor",
      description:
        "Ask anything across your syllabus. Get step-by-step explanations, worked examples, and curriculum-aligned answers.",
      cta: "Start Learning",
      accentColor: "from-blue-500/10 to-blue-600/5",
      borderColor: "hover:border-blue-500/40",
      iconColor: "text-blue-400",
    },
    {
      href: "/quizmode",
      icon: BookOpen,
      title: "Quiz Mode",
      subtitle: "MCQ Practice",
      description:
        "Generate AI-powered MCQs for any subject and level. Track wrong topics, get a summary, and download a PDF report.",
      cta: "Start a quiz",
      accentColor: "from-emerald-500/10 to-emerald-600/5",
      borderColor: "hover:border-emerald-500/40",
      iconColor: "text-emerald-400",
    },
    {
      href: "/topicmode",
      icon: Map,
      title: "Topic Mode",
      subtitle: "Coming Soon",
      description:
        "A structured learning path through your syllabus. Progress through topics, identify weak areas, and study smarter.",
      cta: "Explore topics",
      accentColor: "from-purple-500/10 to-purple-600/5",
      borderColor: "hover:border-purple-500/40",
      iconColor: "text-purple-400",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Home size={20} className="text-white" />
          <span className="font-bold text-lg text-white">Eduble</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 pt-20 pb-40 space-y-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <Image src="/Eddy.png" alt="Eduble" width={100} height={100} />
          <p className="text-sm text-gray-500 uppercase tracking-widest pt-2"></p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-gray-400 text-base max-w-lg">
            What would you like to do today? Choose a mode below to get started.
          </p>
        </motion.div>

        {/* Learner profile stats card */}
        <ProfileStatsCard />

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            const inner = (
              <motion.div
                key={f.href}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={CARD_VARIANTS}
                className={[
                  "relative group flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br",
                  f.accentColor,
                  f.borderColor,
                  "p-6 transition-all duration-300",
                  f.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg hover:shadow-black/40",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={`w-10 h-10 rounded-xl bg-gray-800/80 flex items-center justify-center ${f.iconColor}`}>
                  <Icon size={20} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-semibold ${f.iconColor}`}>{f.title}</h2>
                    {f.disabled && (
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                        Soon
                      </span>
                    )}
                    {!f.disabled && (
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        {f.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                </div>

                {!f.disabled && (
                  <div className={`mt-auto flex items-center gap-1 text-sm font-medium ${f.iconColor} group-hover:gap-2 transition-all`}>
                    {f.cta}
                    <ChevronRight size={15} />
                  </div>
                )}
              </motion.div>
            );

            return f.disabled ? (
              <div key={f.href}>{inner}</div>
            ) : (
              <Link key={f.href} href={f.href} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </main>

      <Footer className="py-6 lg:py-8" showLogo={false} />
    </div>
  );
}
