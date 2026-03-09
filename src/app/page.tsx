import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import { CourseCatalog } from '@/components/landing/CourseCatalog';
import ProblemSolution from '@/components/landing/ProblemSolution';
import { Timeline } from '@/components/landing/Timeline';
import ReferralSection from '@/components/landing/ReferralSection';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSolution />
      <CourseCatalog />
      <Timeline />
      <ReferralSection />
      <Footer />
    </main>
  );
}
