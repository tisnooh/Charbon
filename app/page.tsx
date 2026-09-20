import { Hero } from '@/components/sections/Hero';
import { ProblemSection } from '@/components/sections/ProblemSection';
import { ScoreSection } from '@/components/sections/ScoreSection';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { ProofLineSection } from '@/components/sections/ProofLineSection';
import { AISection } from '@/components/sections/AISection';
import { FocusSection } from '@/components/sections/FocusSection';
import { ProgressSection } from '@/components/sections/ProgressSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { DifferentiationSection } from '@/components/sections/DifferentiationSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { ExtensionsSection } from '@/components/sections/ExtensionsSection';
import { PrivacySection } from '@/components/sections/PrivacySection';
import { FAQSection } from '@/components/sections/FAQSection';
import { FinalCTA } from '@/components/sections/FinalCTA';

/**
 * Landing principale — une seule page, les liens du header scrollent
 * vers les sections. Pages séparées : légales, support, download.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <ScoreSection />
      <HowItWorks />
      <ProofLineSection />
      <AISection />
      <FocusSection />
      <ProgressSection />
      <ProfileSection />
      <DifferentiationSection />
      <PricingSection />
      <ExtensionsSection />
      <PrivacySection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
