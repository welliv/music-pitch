import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { ThreeToOne } from "@/components/sections/ThreeToOne";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Sandbox } from "@/components/sandbox/Sandbox";
import { WhyBlock } from "@/components/sections/WhyBlock";
import { Inspiration } from "@/components/sections/Inspiration";
import { Ask } from "@/components/sections/Ask";
import { Footer } from "@/components/sections/Footer";

export default function App() {
  return (
    <div className="brand-canvas">
      <div className="brand-lightning" aria-hidden />
      <div className="brand-content">
        <Navbar />
        <main>
          <Hero />
          <ThreeToOne />
          <Problem />
          <HowItWorks />
          <Sandbox />
          <WhyBlock />
          <Inspiration />
          <Ask />
        </main>
        <Footer />
      </div>
    </div>
  );
}
