import type { Metadata } from "next";
import "./globals.css";
import { Comfortaa } from "next/font/google";

// IMPORT YOUR SANITY CLIENT HERE (Adjust path if needed!)
import { client } from "@/sanity/lib/client"; 
import { Analytics } from "@vercel/analytics/next"
import SakuraCanvas from "@/components/sai";
import Footer from '@/components/Footer' 
import { AudioProvider, TrackData } from '@/components/AudioContext';
import NowPlayingWidget from '@/components/NowPlayingWidget';

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "Sai",
  description: "Read Umineko (also Mudkip is the GOAT)",
};

// 1. Add the Sanity Query
const NOW_PLAYING_QUERY = `*[_type == "nowPlaying"][0]{
  title,
  artist,
  "audioUrl": audioFile.asset->url,
  loopStart,
  loopEnd
}`;

const FORTUNE_SLIP_QUERY = `*[_type == "fortuneSlip"][0]{
  title,
  preview,
  note
}`;

// 2. Make the layout async so we can fetch data securely on the server
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 3. Fetch the track data from Sanity
  const track: TrackData | null = await client.fetch(NOW_PLAYING_QUERY);
  const fortuneSlip = await client.fetch(FORTUNE_SLIP_QUERY);

  return (
    <html lang="en" className={`scroll-smooth ${comfortaa.variable}`}>
      <body className="bg-[#111424] text-white antialiased min-h-screen relative overflow-x-hidden flex flex-col">
        
        {/* 4. Pass the fetched track data instead of 'null' */}
        <AudioProvider track={track}>
          <SakuraCanvas />
          <div className="flex-1 w-full">
            {children}
          </div>
          <NowPlayingWidget />
        </AudioProvider>
        <Analytics />
        <Footer />
      </body>
    </html>
  );
}