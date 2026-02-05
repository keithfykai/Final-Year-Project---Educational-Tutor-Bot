"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getAuthClient } from "./../../firebase/firebaseClient";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

const SIGN_IN_PATH = "/signin";

export default function NavbarComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
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
    router.push("/");
  };

  const userLabel =
    user?.displayName ||
    user?.email ||
    (user ? `User ${user.uid.slice(0, 6)}` : "");

  if (!mounted) return null;

  const menuItems = [
    { name: 'Chat', href: '/chat' },
    { name: 'Quiz Mode', href: '/quizmode' },
    { name: 'About', href: '/about' },
  ];

  return (
    <Navbar 
      isBordered 
      maxWidth="full" 
      className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 py-3 md:py-6" 
      height="60px md:120px"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Eddy.png" alt="Logo" width={50} height={50} />
            <span className="font-bold text-xl text-black dark:text-white">Eduble</span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="sm:hidden" justify="end">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-black dark:text-white p-2"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className="text-2xl">
            {isMenuOpen ? "✕" : "☰"}
          </span>
        </button>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-8" justify="center">
        <NavbarItem>
          <Link href="/chat" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition font-medium">
            Chat
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/quizmode" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition font-medium">
            Quiz Mode
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/about" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition font-medium">
            About
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end" className="hidden sm:flex gap-3 sm:gap-4">
        {/* Auth Section - Desktop only */}
        {!authLoading && !user && (
          <NavbarItem>
            <Button
              as={Link}
              href={SIGN_IN_PATH}
              className="bg-white text-black hover:opacity-80 rounded-full border border-gray-300"
            >
              Sign in
            </Button>
          </NavbarItem>
        )}

        {!authLoading && user && (
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                className="border-black dark:border-white text-black dark:text-white"
              >
                {userLabel.split("@")[0]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" className="bg-white dark:bg-black">
              <DropdownItem key="profile" isDisabled>
                <p className="font-semibold text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">{userLabel}</p>
              </DropdownItem>
              <DropdownItem key="logout" color="danger">
                <button onClick={handleSignOut} className="w-full text-center text-red-600">
                  Sign out
                </button>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-full right-0 mt-2 w-64 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {menuItems.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                href={item.href}
                className="block px-4 py-3 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Auth in mobile menu */}
            {!authLoading && !user && (
              <div className="px-4 py-2">
                <Button
                  as={Link}
                  href={SIGN_IN_PATH}
                  className="w-full mt-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Button>
              </div>
            )}

            {!authLoading && user && (
              <>
                <div className="px-4 py-2">
                  <div className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="font-semibold text-black dark:text-white text-sm">{userLabel}</p>
                  </div>
                </div>
                <div className="px-4 py-2">
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Navbar>
  );
}
