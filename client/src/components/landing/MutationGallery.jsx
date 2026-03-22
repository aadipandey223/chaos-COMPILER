import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import styles from './MutationGallery.module.css';

const ALL_MUTATIONS = [
  { type: 'OPERATOR_MUTATION', color: '#7a3a9e', before: 'a + b', after: 'a - b', desc: 'Swaps arithmetic and comparison operators', score: 8 },
  { type: 'CONDITION_FLIP', color: '#9e8a3a', before: 'if (x > 0)', after: 'if (!(x > 0))', desc: 'Negates boolean conditions', score: 9 },
  { type: 'LITERAL_SHIFT', color: '#3a8a8a', before: 'int x = 10', after: 'int x = 11', desc: 'Shifts numeric literals by ±1', score: 6 },
  { type: 'RETURN_SWAP', color: '#9e3a3a', before: 'return 0', after: 'return 1', desc: 'Flips return value success/failure', score: 8 },
  { type: 'DEAD_CODE_INJECT', color: '#3a6a9e', before: '(nothing)', after: 'if(0){}', desc: 'Inserts unreachable code blocks', score: 3 },
  { type: 'OFF_BY_ONE', color: '#d4913a', before: 'i < 10', after: 'i < 9', desc: 'Shifts loop/condition bounds', score: 7 },
  { type: 'BOOLEAN_INVERSION', color: '#9a5e9e', before: 'a && b', after: 'a || b', desc: 'Swaps logical AND/OR operators', score: 8 },
  { type: 'STATEMENT_DELETION', color: '#c25050', before: 'x = x + 1;', after: '(removed)', desc: 'Deletes entire statements', score: 9 },
  { type: 'NULL_INJECTION', color: '#5a7a9e', before: 'getData()', after: '0', desc: 'Replaces function calls with NULL', score: 10 },
  { type: 'VARIABLE_SWAP', color: '#6a9e5a', before: 'a - b', after: 'b - a', desc: 'Swaps operands in expressions', score: 7 },
  { type: 'LOOP_BOUND_CHANGE', color: '#8a6a3a', before: 'i < n', after: 'i < n-1', desc: 'Shifts loop termination bounds', score: 7 },
];

function ScoreBar({ score, color }) {
  return (
    <div className={styles.scoreBar}>
      <div className={styles.scoreTrack}>
        <div
          className={styles.scoreFill}
          style={{ width: `${score * 10}%`, background: color }}
        />
      </div>
      <span className={styles.scoreNum} style={{ color }}>{score}/10</span>
    </div>
  );
}

export default function MutationGallery() {
  const containerRef = useRef(null);
  const labelRef = useRef(null);
  const labelInView = useInView(labelRef, { once: true, margin: '-60px' });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', `-${(ALL_MUTATIONS.length - 2.5) * (100 / ALL_MUTATIONS.length)}%`]
  );

  return (
    <section ref={containerRef} className={styles.container}>
      <div className={styles.sticky}>
        <div className={styles.header} ref={labelRef}>
          <motion.div
            className={styles.label}
            initial={{ opacity: 0, y: 20 }}
            animate={labelInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            All mutation types
          </motion.div>
          <motion.h2
            className={styles.heading}
            initial={{ opacity: 0, y: 30 }}
            animate={labelInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            11 ways to break your code
          </motion.h2>
        </div>

        <div className={styles.track}>
          <motion.div className={styles.cards} style={{ x }}>
            {ALL_MUTATIONS.map((m) => (
              <div key={m.type} className={styles.card}>
                <div
                  className={styles.cardType}
                  style={{ color: m.color, borderColor: m.color + '44', background: m.color + '14' }}
                >
                  {m.type}
                </div>

                <div className={styles.cardDiff}>
                  <div className={styles.diffRow}>
                    <span className={styles.diffLabel}>before</span>
                    <code className={styles.diffCode}>{m.before}</code>
                  </div>
                  <div className={styles.diffRow}>
                    <span className={styles.diffLabelAfter}>after</span>
                    <code className={styles.diffCodeAfter}>{m.after}</code>
                  </div>
                </div>

                <p className={styles.cardDesc}>{m.desc}</p>

                <div className={styles.impact}>
                  <span className={styles.impactLabel}>Impact</span>
                  <ScoreBar score={m.score} color={m.color} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
