import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Navbar from '../components/layout/Navbar';
import { containerVariants, itemVariants } from '../utils/motionVariants';
import styles from './LandingPage.module.css';

/* ── Token ticker data ─────────────────────────────────────────────── */
const TICKER_TOKENS = [
  { type: 'KEYWORD', value: 'int'    },
  { type: 'IDENT',   value: 'add'    },
  { type: 'LPAREN',  value: '('      },
  { type: 'KEYWORD', value: 'int'    },
  { type: 'IDENT',   value: 'a'      },
  { type: 'COMMA',   value: ','      },
  { type: 'KEYWORD', value: 'int'    },
  { type: 'IDENT',   value: 'b'      },
  { type: 'RPAREN',  value: ')'      },
  { type: 'LBRACE',  value: '{'      },
  { type: 'KEYWORD', value: 'if'     },
  { type: 'IDENT',   value: 'a'      },
  { type: 'OP',      value: '>'      },
  { type: 'NUMBER',  value: '0'      },
  { type: 'KEYWORD', value: 'return' },
  { type: 'IDENT',   value: 'a'      },
  { type: 'OP',      value: '+'      },
  { type: 'IDENT',   value: 'b'      },
  { type: 'SEMI',    value: ';'      },
  { type: 'RBRACE',  value: '}'      },
];

const TOKEN_COLORS = {
  KEYWORD: 'var(--accent)',
  IDENT:   'var(--info)',
  NUMBER:  'var(--node-literal)',
  OP:      'var(--text-tertiary)',
  LPAREN:  'var(--text-tertiary)',
  RPAREN:  'var(--text-tertiary)',
  LBRACE:  'var(--text-tertiary)',
  RBRACE:  'var(--text-tertiary)',
  COMMA:   'var(--text-tertiary)',
  SEMI:    'var(--text-tertiary)',
};

/* ── Mutation showcase data ────────────────────────────────────────── */
const MUTATIONS = [
  {
    type: 'OPERATOR_MUTATION',
    color: 'var(--mut-operator)',
    before: 'return a + b;',
    after:  'return a - b;',
    desc:   'Swaps arithmetic operators to test edge cases',
  },
  {
    type: 'CONDITION_FLIP',
    color: 'var(--mut-condition)',
    before: 'if (a > 0)',
    after:  'if (!(a > 0))',
    desc:   'Negates conditions to expose missing branches',
  },
  {
    type: 'LITERAL_SHIFT',
    color: 'var(--mut-literal)',
    before: 'int x = 10;',
    after:  'int x = 11;',
    desc:   'Shifts numeric literals to catch off-by-one errors',
  },
  {
    type: 'RETURN_SWAP',
    color: 'var(--mut-return)',
    before: 'return 0;',
    after:  'return 1;',
    desc:   'Flips return values to test error handling',
  },
  {
    type: 'DEAD_CODE_INJECT',
    color: 'var(--mut-deadcode)',
    before: '// (nothing)',
    after:  'if(0){}',
    desc:   'Injects unreachable code to test coverage tools',
  },
];

/* ── Scroll-reveal wrapper ─────────────────────────────────────────── */
function RevealSection({ children, className }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="initial"
      animate={inView ? 'animate' : 'initial'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const words = ['Break', 'your', 'code.', 'On', 'purpose.'];

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroNoise} aria-hidden />
        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroHeading}
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {words.map((word, i) => (
              <motion.span key={i} variants={itemVariants} className={styles.heroWord}>
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Chaos Compiler parses C/C++ into an AST and deliberately mutates it —
            so you can see exactly where your code is fragile.
          </motion.p>

          <motion.div
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/app/editor" className={styles.ctaPrimary}>
              Start compiling →
            </Link>
            <Link to="/learn" className={styles.ctaSecondary}>
              See how it works
            </Link>
          </motion.div>
        </div>

        {/* Token ticker */}
        <div className={styles.tickerWrap} aria-hidden>
          <div className={styles.ticker}>
            {[...TICKER_TOKENS, ...TICKER_TOKENS].map((t, i) => (
              <span
                key={i}
                className={styles.token}
                style={{ color: TOKEN_COLORS[t.type] || 'var(--text-tertiary)' }}
              >
                <span className={styles.tokenValue}>{t.value}</span>
                <span className={styles.tokenType}>{t.type}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <RevealSection className={styles.howItWorks}>
          <motion.div variants={itemVariants} className={styles.sectionLabel}>
            How it works
          </motion.div>
          <motion.h2 variants={itemVariants} className={styles.sectionHeading}>
            Three steps to chaos
          </motion.h2>
          <div className={styles.steps}>
            {[
              { n: '1', title: 'Paste your code',   desc: 'Drop any C/C++ function into the editor. Use the built-in example or upload a file.' },
              { n: '2', title: 'Parse into AST',     desc: 'The compiler tokenizes and parses your code into a full Abstract Syntax Tree.' },
              { n: '3', title: 'Mutate & visualize', desc: 'The chaos engine applies mutations. See every change in the diff, AST, and log.' },
            ].map(({ n, title, desc }, i) => (
              <motion.div key={i} variants={itemVariants} className={styles.stepCard}>
                <div className={styles.stepNum}>{n}</div>
                <h3 className={styles.stepTitle}>{title}</h3>
                <p className={styles.stepDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── Feature showcase ─────────────────────────────────────── */}
      <section className={styles.sectionAlt}>
        <RevealSection className={styles.features}>
          <motion.div variants={itemVariants} className={styles.sectionLabel}>Features</motion.div>
          <motion.h2 variants={itemVariants} className={styles.sectionHeading}>
            Everything you need to understand mutation
          </motion.h2>
          <div className={styles.featureGrid}>
            {[
              {
                icon: '⬡',
                title: 'AST Visualizer',
                desc: 'Interactive D3 tree of your parsed code. Drag nodes, zoom, search, and click to inspect any node.',
                link: '/app/ast',
              },
              {
                icon: '⚡',
                title: 'Mutation Engine',
                desc: '5 mutation types with seed-based reproducibility. Low, medium, or high intensity.',
                link: '/app/log',
              },
              {
                icon: '◈',
                title: 'Learn Mode',
                desc: '5-stage animated compiler walkthrough — from lexer to code generation.',
                link: '/learn',
              },
            ].map(({ icon, title, desc, link }, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Link to={link} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{icon}</div>
                  <h3 className={styles.featureTitle}>{title}</h3>
                  <p className={styles.featureDesc}>{desc}</p>
                  <span className={styles.featureArrow}>→</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── Mutation types ───────────────────────────────────────── */}
      <section className={styles.section}>
        <RevealSection>
          <motion.div variants={itemVariants} className={styles.sectionLabel}>Mutation types</motion.div>
          <motion.h2 variants={itemVariants} className={styles.sectionHeading}>
            Five ways to break your code
          </motion.h2>
        </RevealSection>
        <div className={styles.mutationScroll}>
          {MUTATIONS.map((m, i) => (
            <div key={i} className={styles.mutationCard}>
              <div
                className={styles.mutationType}
                style={{ color: m.color, borderColor: m.color + '44', background: m.color + '18' }}
              >
                {m.type}
              </div>
              <div className={styles.mutationDiff}>
                <div className={styles.diffBefore}>
                  <span className={styles.diffLabel}>before</span>
                  <code>{m.before}</code>
                </div>
                <div className={styles.diffAfter}>
                  <span className={styles.diffLabel}>after</span>
                  <code>{m.after}</code>
                </div>
              </div>
              <p className={styles.mutationDesc}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <RevealSection className={styles.ctaBannerInner}>
          <motion.h2 variants={itemVariants} className={styles.ctaHeading}>
            Ready to chaos your code?
          </motion.h2>
          <motion.p variants={itemVariants} className={styles.ctaDesc}>
            Paste any C function and see what breaks.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link to="/app/editor" className={styles.ctaPrimary}>
              Open the compiler →
            </Link>
          </motion.div>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Chaos Compiler</span>
        <span className={styles.footerSep}>·</span>
        <span>Built for CS students and compiler nerds</span>
      </footer>
    </div>
  );
}
