import { ActionCards } from "@/components/landing/ActionCards";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { NavBar } from "@/components/landing/NavBar";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <ActionCards />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
