import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy | Sai",
  description: "What information this site collects and how it's used.",
};

const LAST_UPDATED = "August 15, 2026";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "18px",
        fontWeight: 700,
        color: "#e5729f",
        marginTop: "2.25rem",
        marginBottom: "0.75rem",
        fontFamily: "monospace",
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "#fff",
        marginTop: "1.25rem",
        marginBottom: "0.5rem",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "15px",
        color: "rgba(255, 255, 255, 0.8)",
        lineHeight: 1.7,
        marginBottom: "1rem",
      }}
    >
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        listStyleType: "disc",
        paddingLeft: "1.5rem",
        marginBottom: "1rem",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "15px",
        lineHeight: 1.7,
      }}
    >
      {children}
    </ul>
  );
}

function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: "0.5rem" }}>{children}</li>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#e5729f", textDecoration: "underline" }}
    >
      {children}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ paddingBottom: "4rem" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <P>
            This is a personal, non-commercial site. This page explains what information it
            collects, why, and what your choices are. If anything here is unclear, the contact
            details at the bottom are the fastest way to reach me.
          </P>

          <H2>What This Site Collects</H2>

          <H3>Analytics &amp; Performance (Vercel)</H3>
          <P>
            This site uses <ExternalLink href="https://vercel.com/docs/analytics">Vercel Web Analytics</ExternalLink> and{" "}
            <ExternalLink href="https://vercel.com/docs/speed-insights">Vercel Speed Insights</ExternalLink> to
            understand traffic and catch performance problems. These collect, per page visit:
          </P>
          <UL>
            <LI>Page views and referring pages</LI>
            <LI>Approximate country/region </LI>
            <LI>Device type, operating system, and browser</LI>
            <LI>Page load / performance metrics (Core Web Vitals)</LI>
          </UL>
          <P>
            Neither tool uses cookies or any persistent identifier to track you across visits or
            across other websites. Nothing here can be tied back to you personally.
          </P>

          <H3>Locally Stored Preferences</H3>
          <P>
            Some features save small pieces of state directly in your browser (<code style={{ fontFamily: "monospace", fontSize: "13px", color: "#e5729f" }}>localStorage</code>),
            purely so your preferences persist between visits. This data never leaves your device
            or gets sent to me:
          </P>
          <UL>
            <LI>Tetris control bindings and handling settings (DAS/ARR/SDF, keybinds)</LI>
            <LI>Site background theme choice</LI>
            <LI>Fortune slip draw history: when you last drew, your current streak, and the streak reward text</LI>
            <LI>The nickname you choose for online Tetris play (so you don&apos;t have to retype it each time)</LI>
          </UL>
          <P>
            You can clear any of this at any time by clearing your browser&apos;s site data for this
            domain nothing is lost on my end, because none of it is stored on my end.
          </P>

          <H3>Tetris Leaderboard (Supabase)</H3>
          <P>
            If you finish a Sprint or Blitz run and it qualifies for the leaderboard, you&apos;re
            asked to type up to 3 initials. That entry includes your initials, score, level, game mode,
            and timestamp is stored in a database (Supabase) and displayed publicly on the
            leaderboard. I don&apos;t verify or require your real name here, and no other
            information is attached to a leaderboard entry. If you&apos;d like an entry removed,
            contact me and I&apos;ll take it down.
          </P>

          <H3>Online Multiplayer (Supabase Realtime)</H3>
          <P>
            The Online Play lobby uses Supabase Realtime to connect players in the same room. While
            you&apos;re in a room, a randomly generated session ID and your chosen nickname are
            broadcast live to other players in that room, so everyone can see who&apos;s connected
            and their in-game state. This isn&apos;t written to a database and exists only for the
            life of that session and disappears once everyone leaves the room.
          </P>

          <H2>What This Site Does Not Collect</H2>
          <UL>
            <LI>No accounts, no sign-up, no passwords</LI>
            <LI>No email addresses or contact information, unless you choose to email me directly</LI>
            <LI>No payment or financial information</LI>
            <LI>No tracking cookies or cross-site/cross-device tracking</LI>
            <LI>Your data is never sold or shared with advertisers</LI>
          </UL>

          <H2>Third-Party Services</H2>
          <P>This site is built on a few third-party services, each with its own privacy practices:</P>
          <UL>
            <LI><strong>Vercel</strong> - hosting, analytics, and performance monitoring. See <ExternalLink href="https://vercel.com/legal/privacy-policy">Vercel&apos;s Privacy Policy</ExternalLink>.</LI>
            <LI><strong>Supabase</strong> - database for the leaderboard and the real-time connection behind online multiplayer. See <ExternalLink href="https://supabase.com/privacy">Supabase&apos;s Privacy Policy</ExternalLink>.</LI>
            <LI><strong>Sanity</strong> - content management for blog posts and site content; doesn&apos;t process visitor data. See <ExternalLink href="https://www.sanity.io/legal/privacy">Sanity&apos;s Privacy Policy</ExternalLink>.</LI>
            <LI><strong>Spotify</strong> - the &quot;Now Playing&quot; widget shows what I&apos;m currently listening to, using a personal Spotify account server-side. It doesn&apos;t read or store anything about you as a visitor.</LI>
          </UL>

          <H2>Children&apos;s Privacy</H2>
          <P>
            This site isn&apos;t directed at children under 13, and I don&apos;t knowingly collect
            information from them.
          </P>

          <H2>Your Choices</H2>
          <UL>
            <LI>Clear your browser&apos;s local storage for this site at any time to remove saved preferences.</LI>
            <LI>Ask me to remove a specific leaderboard entry.</LI>
            <LI>Use a browser extension or setting that blocks analytics - the site will work exactly the same.</LI>
          </UL>

          <H2>Changes to This Policy</H2>
          <P>
            If what this site collects changes, this page will be updated and the date at the top
            will reflect that. Since this is a personal project, I won&apos;t always send a
            separate notice - checking back here is the reliable way to stay current.
          </P>

          <H2>Contact</H2>
          <P>
            Questions, concerns, or a leaderboard removal request - reach out through any of the
            contact methods linked elsewhere on this site.
          </P>
          <ExternalLink href="https://github.com/Keepas3/Sai">https://github.com/Keepas3/Sai</ExternalLink>
        </div>
      </main>
    </>
  );
}
