import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Sandwich Cat | Sai",
  description: "You found the rarest cat in the garden.",
};

export default function SandwichCatPage() {
  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container flex flex-col items-center justify-center text-center">
        <h1 className="page-title">You found the sandwich cat!</h1>

        <img
          src="/sandwich_cat.png"
          alt="A cat that is also, somehow, a sandwich"
          style={{
            maxWidth: "320px",
            width: "100%",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            margin: "1.5rem 0",
          }}
        />

        <p className="text-white/60 max-w-md mx-auto" style={{ lineHeight: 1.7 }}>
          Rarer than the petals, rarer than luck itself, you happened to click
          on a sandwich cat on the screen. There&apos;s nothing else
          here. Just this cat. Enjoy it.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block text-sm"
          style={{ color: "#e5729f", textDecoration: "underline" }}
        >
          ← Back home
        </Link>
      </main>
    </div>
  );
}
