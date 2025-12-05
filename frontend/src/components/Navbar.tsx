"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
// import { onAuthStateChanged, signOut, User } from "firebase/auth";
// import { getAuthClient } from "../../firebase/firebaseClient"; // <-- client-only wrapper

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // const [user, setUser] = useState<User | null>(null);

  // useEffect(() => {
  //   const auth = getAuthClient(); // initialize only in browser
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const handleNavClick = () => setMenuOpen(false);

  // const handleSignOut = () => {
  //   const auth = getAuthClient();
  //   signOut(auth);
  //   handleNavClick();
  // };

  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" onClick={handleNavClick}>
              <Image src="/Eddy.png" alt="Logo" width={40} height={40} />
            </Link>
            <Link href="/" onClick={handleNavClick}>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
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
            <Link
              href="/about"
              className="text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400"
            >
              About
            </Link>

            {/* {user ? (
              <button
                // onClick={handleSignOut}
                className="text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/signin"
                className="text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400"
                onClick={handleNavClick}
              >
                Sign In
              </Link>
            )} */}
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

          {/* {user ? (
            <>
              <span className="block px-3 py-2 text-gray-700 dark:text-gray-300">
                {user.displayName || user.email}
              </span>
              <button
                // onClick={handleSignOut}
                className="block px-3 py-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={handleNavClick}
            >
              Sign In
            </Link>
          )} */}

          <Link
            href="/chat"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleNavClick}
          >
            Chat
          </Link>
        </div>
      )}
    </nav>
  );
}
