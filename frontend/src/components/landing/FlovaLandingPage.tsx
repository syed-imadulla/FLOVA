import React from "react";
import { FlovaNavbar } from "./FlovaNavbar";
import { FlovaHero } from "./FlovaHero";
import { FlovaPillars } from "./FlovaPillars";
import { FlovaHowItWorks } from "./FlovaHowItWorks";
import { FlovaIndiaContext } from "./FlovaIndiaContext";
import { FlovaClarityShowcase } from "./FlovaClarityShowcase";
import { FlovaUserStories } from "./FlovaUserStories";
import { FlovaBottomCTA } from "./FlovaBottomCTA";
import { FlovaFooter } from "./FlovaFooter";

export const FlovaLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#16181D] font-sans selection:bg-[#0F5C4C] selection:text-white">
      {/* 1. Top Navigation Bar */}
      <FlovaNavbar />

      <main>
        {/* 2. Hero Section: Soft warm-ivory / sage-tinted canvas with Indian irregular-income context */}
        <FlovaHero />

        {/* 3. 4-Column Core Pillars Strip */}
        <FlovaPillars />

        {/* 4. "How It Works" Band on Soft Sage/Mint Surface */}
        <FlovaHowItWorks />

        {/* 5. Indian Context & Trust / Scale Strip */}
        <FlovaIndiaContext />

        {/* 6. "Designed for Clarity" Multi-Screen Showcase */}
        <FlovaClarityShowcase />

        {/* 7. User Stories / Testimonials Band */}
        <FlovaUserStories />

        {/* 8. Bottom CTA Banner */}
        <FlovaBottomCTA />
      </main>

      {/* 9. Clean FLOVA Footer */}
      <FlovaFooter />
    </div>
  );
};
