"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getAuthClient } from "./../../firebase/firebaseClient"; // <-- adjust path if needed

const SIGN_IN_PATH = "/signin"; // change if your route is /sign-in etc.

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  const handleNavClick = () => setMenuOpen(false);

  useEffect(() => {
    const auth = getAuthClient();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    const auth = getAuthClient();
    await signOut(auth);
    setMenuOpen(false);
    router.push("/");
  };

  const userLabel =
    user?.displayName ||
    user?.email ||
    (user ? `User ${user.uid.slice(0, 6)}` : "");

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" onClick={handleNavClick}>
              <Image src="/Eddy.png" alt="Logo" width={40} height={40} />
            </Link>

            <Link href="/" onClick={handleNavClick}>
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Eduble
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/chat"
              className="text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Chat
            </Link>

            <Link href="/quizmode" onClick={handleNavClick}>
              <span className="ml-4 px-2 py-1 text-sm font-medium text-white bg-sky-600 rounded-full hover:bg-sky-700 transition">
                Quiz Mode
              </span>
            </Link>

            <Link
              href="/about"
              className="text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400"
            >
              About
            </Link>

            {/* Auth */}
            {!authLoading && !user && (
              <Link
                href={SIGN_IN_PATH}
                onClick={handleNavClick}
                className="ml-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-100 dark:hover:bg-slate-800"
              >
                Sign in
              </Link>
            )}

            {!authLoading && user && (
              <div className="ml-2 flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                  {userLabel}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-800"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/about"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleNavClick}
          >
            About
          </Link>

          <Link
            href="/chat"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleNavClick}
          >
            Chat
          </Link>

          <Link
            href="/quizmode"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleNavClick}
          >
            Quiz Mode
          </Link>

          {/* Mobile Auth */}
          {!authLoading && !user && (
            <Link
              href={SIGN_IN_PATH}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={handleNavClick}
            >
              Sign in
            </Link>
          )}

          {!authLoading && user && (
            <div className="px-3 py-2 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {userLabel}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 rounded-md text-base font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
