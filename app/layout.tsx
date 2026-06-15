import type { Metadata } from "next";
import "./globals.css";

import SakuraCanvas from "@/components/sai";
import Footer from '@/components/Footer' 

export const metadata: Metadata = {
  title: "Sai",
  description: "Read Umineko (also Mudkip is the GOAT)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* 1. Added "flex flex-col" here to stack the page vertically */}
      <body className="bg-[#111424] text-white antialiased min-h-screen relative overflow-x-hidden flex flex-col">
        
        <SakuraCanvas />
        
        {/* 2. Wrapped children in a flex-1 div. This forces the content to push the footer down! */}
        <div className="flex-1 w-full">
          {children}
        </div>
        
        <Footer />
      </body>
    </html>
  );
}