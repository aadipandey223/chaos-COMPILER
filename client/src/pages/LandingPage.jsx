import React, { lazy, Suspense } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useLenis } from '../hooks/useLenis';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import FeatureCards from '../components/landing/FeatureCards';
import CTASection from '../components/landing/CTASection';
import styles from './LandingPage.module.css';

/* Lazy-load heaviest sections */
const MutationShowcase = lazy(() => import('../components/landing/MutationShowcase'));
const MutationGallery = lazy(() => import('../components/landing/MutationGallery'));

function SectionFallback() {
  return <div className={styles.sectionFallback} />;
}

export default function LandingPage() {
  useLenis();
  const { scrollYProgress } = useScroll();

  return (
    <div className={styles.page}>
      {/* Scroll progress bar */}
      <motion.div
        className={styles.progressBar}
        style={{
          scaleX: scrollYProgress,
        }}
      />

      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <MutationShowcase />
      </Suspense>

      <StatsSection />
      <FeatureCards />

      <Suspense fallback={<SectionFallback />}>
        <MutationGallery />
      </Suspense>

      <CTASection />
    </div>
  );
}
