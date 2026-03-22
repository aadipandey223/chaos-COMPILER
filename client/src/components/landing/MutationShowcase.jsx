import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './MutationShowcase.module.css';

const CODE_LINES = [
  'int add(int a, int b) {',
  '    return a + b;',
  '}',
  '',
  'int main() {',
  '    int x = 10;',
  '    int y = 20;',
  '    if (x < y) {',
  '        x = x + 1;',
  '    }',
  '    return add(x, y);',
  '}',
];

const MUTATIONS = [
  {
    type: 'OPERATOR_MUTATION',
    color: '#7a3a9e',
    title: 'Operator Mutation',
    desc: 'Swaps arithmetic and comparison operators to test whether your code handles edge cases correctly.',
    line: 1,
    before: 'return a + b;',
    after: 'return a - b;',
    badge: 'a + b → a - b',
  },
  {
    type: 'CONDITION_FLIP',
    color: '#9e8a3a',
    title: 'Condition Flip',
    desc: 'Negates boolean conditions to expose untested branches and missing edge case handling.',
    line: 7,
    before: 'if (x < y) {',
    after: 'if (!(x < y)) {',
    badge: 'x < y → !(x < y)',
  },
  {
    type: 'LITERAL_SHIFT',
    color: '#3a8a8a',
    title: 'Literal Shift',
    desc: 'Shifts numeric literals by ±1 to catch classic off-by-one errors hiding in your logic.',
    line: 5,
    before: 'int x = 10;',
    after: 'int x = 11;',
    badge: '10 → 11',
  },
  {
    type: 'DEAD_CODE_INJECT',
    color: '#3a6a9e',
    title: 'Dead Code Injection',
    desc: 'Injects unreachable if(0){} blocks to test whether coverage tools and static analyzers catch it.',
    line: 9,
    before: '    }',
    after: '    } if(0){}',
    badge: '→ if(0){}',
  },
];

export default function MutationShowcase() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Which mutation card is active (0-3) based on scroll
  const activeIndex = useTransform(scrollYProgress, [0, 1], [0, MUTATIONS.length - 0.01]);

  // Opacity for each card
  const cardOpacities = MUTATIONS.map((_, i) =>
    useTransform(
      scrollYProgress,
      [i / MUTATIONS.length, (i + 0.5) / MUTATIONS.length, (i + 1) / MUTATIONS.length],
      [0, 1, i < MUTATIONS.length - 1 ? 0 : 1]
    )
  );

  // Which line to highlight
  const highlightLine = useTransform(activeIndex, (v) => {
    const idx = Math.floor(v);
    return MUTATIONS[Math.min(idx, MUTATIONS.length - 1)]?.line ?? -1;
  });

  return (
    <section ref={containerRef} className={styles.container}>
      <div className={styles.sticky}>
        {/* Section label */}
        <div className={styles.sectionLabel}>
          <span className={styles.labelDot} />
          How it mutates
        </div>

        <div className={styles.columns}>
          {/* Left — mutation cards */}
          <div className={styles.left}>
            {MUTATIONS.map((m, i) => (
              <motion.div
                key={m.type}
                className={styles.card}
                style={{ opacity: cardOpacities[i] }}
              >
                <div className={styles.cardBadge} style={{ background: m.color + '22', color: m.color, borderColor: m.color + '44' }}>
                  {m.type}
                </div>
                <h3 className={styles.cardTitle}>{m.title}</h3>
                <p className={styles.cardDesc}>{m.desc}</p>
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
              </motion.div>
            ))}
          </div>

          {/* Right — code panel (sticky) */}
          <div className={styles.right}>
            <div className={styles.codeHeader}>
              <span className={styles.codeDot} style={{ background: '#e05c3a' }} />
              <span className={styles.codeDot} style={{ background: '#9e8a3a' }} />
              <span className={styles.codeDot} style={{ background: '#3a9e6e' }} />
              <span className={styles.codeTitle}>example.c</span>
            </div>
            <div className={styles.codeBody}>
              {CODE_LINES.map((line, i) => (
                <CodeLine
                  key={i}
                  num={i}
                  text={line}
                  highlightLine={highlightLine}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Individual code line with scroll-driven highlight ────────────── */
function CodeLine({ num, text, highlightLine }) {
  const isHighlighted = useTransform(highlightLine, (hl) => hl === num);
  const bg = useTransform(isHighlighted, (v) =>
    v ? 'rgba(224,92,58,0.10)' : 'transparent'
  );
  const borderLeft = useTransform(isHighlighted, (v) =>
    v ? '2px solid #e05c3a' : '2px solid transparent'
  );

  return (
    <motion.div className={styles.codeLine} style={{ background: bg, borderLeft }}>
      <span className={styles.lineNum}>{num + 1}</span>
      <code className={styles.lineText}>{text || '\u00A0'}</code>
    </motion.div>
  );
}
