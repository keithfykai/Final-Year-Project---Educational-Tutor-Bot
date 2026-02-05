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

  return (
    <Navbar isBordered maxWidth="full" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 py-3 md:py-6" height="60px md:120px">
      <NavbarBrand>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/Eddy.png" alt="Logo" width={50} height={50} />
          <span className="font-bold text-xl text-black dark:text-white">Eduble</span>
        </Link>
      </NavbarBrand>

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

      <NavbarContent justify="end" className="gap-3 sm:gap-4">
        {/* Auth Section */}
        {!authLoading && !user && (
          <NavbarItem>
            <Button
              as={Link}
              href={SIGN_IN_PATH}
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
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
    </Navbar>
  );
}
