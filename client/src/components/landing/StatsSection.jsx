import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import styles from './StatsSection.module.css';

const STATS = [
  { value: 11, suffix: '', label: 'Mutation types' },
  { value: 100, suffix: '%', label: 'Open source' },
  { value: 0, suffix: '', label: 'External AI dependencies', prefix: '' },
];

function AnimatedCounter({ value, suffix = '', isInView }) {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: isInView ? value : 0 },
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return (
    <animated.span>
      {number.to((n) => `${Math.floor(n)}${suffix}`)}
    </animated.span>
  );
}

export default function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.inner}>
        <motion.div
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          By the numbers
        </motion.div>

        <div className={styles.grid}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.stat}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.value}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} isInView={isInView} />
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
