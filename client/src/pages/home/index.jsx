import { useEffect } from 'react';
import PublicLayout from '../../layouts/PublicLayout.jsx';
import HeroSection from './HeroSection.jsx';
import FeaturesSection from './FeaturesSection.jsx';
import StatsSection from './StatsSection.jsx';
import MenuPreviewSection from './MenuPreviewSection.jsx';
import TestimonialsSection from './TestimonialsSection.jsx';

export default function HomePage() {
  useEffect(() => {
    document.title = 'Habesha Grand Hotel — Authentic Ethiopian Dining';
  }, []);

  return (
    <PublicLayout>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <MenuPreviewSection />
      <TestimonialsSection />
    </PublicLayout>
  );
}
