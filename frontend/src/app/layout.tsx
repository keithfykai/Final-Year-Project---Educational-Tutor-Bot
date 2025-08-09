'use client';

import "./globals.css";
import React, { use } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode;}>) {
  const pathname = usePathname();

  const hideNavAndFooter = pathname === '/chat'
  
  return (
    <html lang="en">
        <body className="flex flex-col min-h-screen">
          {!hideNavAndFooter && <Navbar />}
            <main className="flex-grow">{children}</main>
          {!hideNavAndFooter && <Footer />}
        </body>
    </html>
  );
}

