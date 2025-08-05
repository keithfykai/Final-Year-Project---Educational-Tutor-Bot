"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Toggle dark mode class on html element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close menu on navigation
  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-sky-100 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" onClick={handleNavClick}>
              <Image src="/Eddy.png" alt="Logo" width={40} height={40} />
            </Link>
            <Link href="/" onClick={handleNavClick}>
               <span className="text-xl font-bold text-slate-900 dark:text-white">
                Educational Tutor Bot
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
            <Link
              href="/signin"
              className="text-gray-700 dark:text-gray-300 hover:underline"
              onClick={handleNavClick}
            >
              Sign In
            </Link>
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
            href="/signin"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleNavClick}
          >
            Sign In
          </Link>
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
