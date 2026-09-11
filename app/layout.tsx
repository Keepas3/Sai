import type { Metadata } from "next";
import "./globals.css";
import { Comfortaa } from "next/font/google";

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import SakuraCanvas from "@/components/sai";
import Footer from '@/components/Footer'
import { AudioProvider } from '@/components/AudioContext';
import NowPlayingWidget from '@/components/NowPlayingWidget';
import GlowCursor from '@/components/GlowCursor';

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "Sai",
  description: "Read Umineko (also Mudkip is the GOAT)",
};

// This used to be an async server component that `await`ed two Sanity
// fetches (the now-playing track, plus a `fortuneSlip` query whose result
// was never even used anywhere below) before sending ANY html for every
// single page on the site — directly inflating FCP/TTFB sitewide. The
// now-playing track is fetched client-side instead now (see
// AudioContext.tsx's own useEffect) since NowPlayingWidget already renders
// nothing until `track` resolves, so there's nothing here worth blocking
// the initial paint for. The layout no longer needs to be async at all.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${comfortaa.variable}`}>
      <body className="bg-[#111424] text-white antialiased min-h-screen relative overflow-x-hidden flex flex-col">

        <AudioProvider>
          <SakuraCanvas />
          {/* A fixed, viewport-sized overlay (see GlowCursor.module.css) —
              a plain sibling like SakuraCanvas, not a wrapper around
              children, since it no longer participates in page layout at
              all (pointer-events:none the whole way through). */}
          <GlowCursor
            color="#67E8F9"
            secondaryColor="#A78BFA"
            // GlowCursor.tsx's MAX_POINTS is 32 (tuned down from the demo's
            // 64 for performance — see its comment); 40 here would just get
            // silently clamped to 32 by the same runtime clamp in the
            // render loop, so keeping this under the cap avoids the mismatch.
            trailLength={28}
            trailWidth={8}
            trailTaper={0.8}
            followSpeed={0.16}
            // Toned down from the original 1.9/0.65/1.25/1 — same blue, just
            // dimmer and less white-hot at the core so it reads as a soft
            // tint that blends into the site's own dark background instead
            // of a bright, attention-grabbing trail.
            glowIntensity={1.1}
            glowSpread={1.2}
            hotspot={0.35}
            brightness={0.85}
            opacity={0.5}
            pulseSpeed={1.1}
            noiseStrength={0.035}
            idleFade
            idleTimeout={700}
            fadeDuration={900}
            blendMode="screen"
          />
          <div className="flex-1 w-full">
            {children}
          </div>
          <NowPlayingWidget />
        </AudioProvider>
        <Analytics />
        <SpeedInsights />
        <Footer />
      </body>
    </html>
  );
}