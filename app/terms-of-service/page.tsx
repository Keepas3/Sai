import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service | Sai",
  description: "The terms that govern using this site.",
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

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <P>
            This is a personal, non-commercial site - a portfolio, blog, and a bunch of other things built for fun.
            By using it, you &apos;re agreeing to the terms below.
          </P>

          <H2>Use of the Site</H2>
          <P>
            You&apos;re welcome to browse, read, and play here for personal, non-commercial
            purposes. You agree not to:
          </P>
          <UL>
            <LI>Use the site for anything illegal, or in a way that could damage, disable, or overburden it</LI>
            <LI>Attempt to access parts of the site or its backend (databases, admin tools) you&apos;re not meant to reach</LI>
            <LI>Scrape, bulk-download, or use automated tools against the site outside of normal, incidental use</LI>
            <LI>Harass, impersonate, or abuse other players in the online Tetris lobby</LI>
            <LI>Cheat, exploit bugs to gain an unfair advantage, or otherwise interfere with the leaderboard or multiplayer matches in bad faith</LI>
            <LI>Submit leaderboard initials or a multiplayer nickname that&apos;s abusive, impersonates someone else, or is otherwise inappropriate</LI>
          </UL>
          <P>
            I can remove leaderboard entries, cut off access to the multiplayer lobby, or otherwise
            restrict use of the site for any of the reasons listed above.
          </P>

          <H2>Content You Submit</H2>
          <P>
            The only things you can submit here are leaderboard initials (up to 3 characters) and
            an online-play nickname (up to 4 characters) - see the{" "}
            <ExternalLink href="/privacy-policy">Privacy Policy</ExternalLink> , for exactly how
            those are stored and shared. By submitting either, you confirm it doesn&apos;t
            impersonate someone else or contain anything abusive, and you agree I can display,
            edit, or remove it at any time without notice.
          </P>

          <H2>Intellectual Property</H2>
          <P>
            The site&apos;s design, original written content, and code are mine unless stated
            otherwise. Media referenced or discussed on the site - game titles, anime, music,
            box art, and anything of the sort - belongs to its respective owners and is used here for
            commentary, review, and personal purposes, not to claim ownership over it.
            If you believe something on this site infringes your rights, reach out (see Contact
            below) and the matter will be addressed.
          </P>

          <H2>Third-Party Services</H2>
          <P>
            This site runs on and links out to third-party services - Vercel, Supabase, Sanity,
            Spotify, and links within blog posts. I don&apos;t control those services or
            external sites and I&apos;m not responsible for their content, availability, or how
            they handle your data once you&apos;re there. Details on which services this site
            itself uses are in the <ExternalLink href="/privacy-policy">Privacy Policy</ExternalLink>.
          </P>

          <H2>No Warranty</H2>
          <P>
            This site - including the Tetris game, online multiplayer, leaderboard, fortune
            slip, and every other feature - is provided &quot;as is&quot; and &quot;as
            available,&quot; with no warranties of any kind, express or implied. That includes,
            without limitation, no warranty that the site will be uninterrupted, error-free,
            secure, or that any bug will get fixed.
          </P>

          <H2>Limitation of Liability</H2>
          <P>
            To the fullest extent permitted by law, I am not liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of data, arising
            out of or related to your use of - or inability to use - this site, even if
            advised of the possibility of such damages. Since this site is free, non-commercial,
            and collects no payment from users, my total liability to you for any claim arising
            from use of the site is, in any event, zero.
          </P>

          <H2>Indemnification</H2>
          <P>
            You agree to hold me harmless from any claim or demand - including reasonable legal
            fees - made by any third party arising out of your use of the site, your violation
            of these terms, or your violation of any rights of another person or entity.
          </P>

          <H2>Availability &amp; Changes</H2>
          <P>
            I can modify, suspend, or discontinue any part of this site - including the
            multiplayer lobby, the leaderboard, or the site entirely - at any time, for any
            reason, without notice or liability to you.
          </P>

          <H2>Governing Law</H2>
          <P>
            These terms are governed by the laws present in the United States, without
            regard to conflict-of-law principles. If you access this site from outside that
            jurisdiction, you&apos;re responsible for complying with your own local laws.
          </P>

          <H2>Severability</H2>
          <P>
            If any part of these terms turns out to be unenforceable, the rest still stands -
            only that specific part is affected.
          </P>

          <H2>Changes to These Terms</H2>
          <P>
            I may update these terms as the site changes. The date at the top reflects the most
            recent update. Continuing to use the site after a change means you accept the
            updated terms.
          </P>

          <H2>Contact</H2>
          <P>Questions about these terms - reach out here:</P>
          <ExternalLink href="https://github.com/Keepas3/Sai">https://github.com/Keepas3/Sai</ExternalLink>
        </div>
      </main>
    </>
  );
}
