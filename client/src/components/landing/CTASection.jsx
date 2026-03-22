import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import styles from './CTASection.module.css';

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Gradient fill: text goes from outline to filled as user scrolls
  const gradientStop = useTransform(scrollYProgress, [0.1, 0.5], [0, 100]);

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.inner}>
        <motion.h2
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className={styles.gradientText}
            style={{
              backgroundImage: useTransform(
                gradientStop,
                (v) =>
                  `linear-gradient(to right, #e8e4dd ${v}%, rgba(232,228,221,0.15) ${v}%)`
              ),
            }}
          >
            Ready to chaos your code?
          </motion.span>
        </motion.h2>

        <motion.p
          className={styles.desc}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Paste any C function and see what breaks.
        </motion.p>

        <motion.div
          className={styles.buttons}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/app/editor" className={styles.ctaPrimary}>
            Start compiling →
          </Link>
          <Link to="/learn" className={styles.ctaSecondary}>
            See how it works
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Chaos Compiler</span>
        <span className={styles.sep}>·</span>
        <span>Built for CS students and compiler nerds</span>
      </footer>
    </section>
  );
}
