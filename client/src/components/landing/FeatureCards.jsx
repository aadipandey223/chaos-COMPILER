import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styles from './FeatureCards.module.css';

const FEATURES = [
  {
    icon: '⬡',
    title: 'AST Visualizer',
    desc: 'Interactive D3 tree of your parsed code. Drag, zoom, search, and click to inspect any node in the tree.',
    link: '/app/ast',
    accent: '#3a9e6e',
  },
  {
    icon: '⚡',
    title: 'Chaos Engine',
    desc: '11 mutation types with seed-based reproducibility. Low, medium, or high intensity — predictable chaos.',
    link: '/app/log',
    accent: '#e05c3a',
  },
  {
    icon: '◈',
    title: 'Learn Mode',
    desc: '5-stage animated compiler walkthrough — from lexer to code generation. No textbook required.',
    link: '/learn',
    accent: '#5090d8',
  },
];

function TiltCard({ children, accent }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform =
      `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    cardRef.current.style.transform =
      'perspective(800px) rotateX(0) rotateY(0) scale(1)';
  }, []);

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ '--card-accent': accent }}
    >
      {children}
    </div>
  );
}

export default function FeatureCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.inner}>
        <motion.div
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Features
        </motion.div>
        <motion.h2
          className={styles.heading}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          Everything you need to understand mutation
        </motion.h2>

        <div className={styles.grid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={f.link} className={styles.cardLink}>
                <TiltCard accent={f.accent}>
                  <div className={styles.cardIcon} style={{ color: f.accent }}>
                    {f.icon}
                  </div>
                  <h3 className={styles.cardTitle}>{f.title}</h3>
                  <p className={styles.cardDesc}>{f.desc}</p>
                  <span className={styles.cardArrow}>→</span>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
