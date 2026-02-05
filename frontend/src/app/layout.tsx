'use client';

import "./globals.css";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";
import { HeroUIProvider } from "@heroui/react";

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode;}>) {
  const pathname = usePathname();

  const hideNavAndFooter = pathname === '/chat'
  
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen bg-black text-white">
        <HeroUIProvider>
          {!hideNavAndFooter && <Navbar />}

          <main className={`flex-grow ${hideNavAndFooter ? "flex flex-col h-screen" : ""}`}>
            {children}
          </main>
          
          {!hideNavAndFooter && <Footer />}
        </HeroUIProvider>
      </body>
    </html>
  );
}

