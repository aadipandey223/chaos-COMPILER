import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

/* ── Token ticker data ─────────────────────────────────────────────── */
const TICKER_TOKENS = [
  { type: 'KEYWORD', value: 'int' },
  { type: 'IDENT', value: 'add' },
  { type: 'LPAREN', value: '(' },
  { type: 'KEYWORD', value: 'int' },
  { type: 'IDENT', value: 'a' },
  { type: 'COMMA', value: ',' },
  { type: 'KEYWORD', value: 'int' },
  { type: 'IDENT', value: 'b' },
  { type: 'RPAREN', value: ')' },
  { type: 'LBRACE', value: '{' },
  { type: 'KEYWORD', value: 'if' },
  { type: 'IDENT', value: 'a' },
  { type: 'OP', value: '>' },
  { type: 'NUMBER', value: '0' },
  { type: 'KEYWORD', value: 'return' },
  { type: 'IDENT', value: 'a' },
  { type: 'OP', value: '+' },
  { type: 'IDENT', value: 'b' },
  { type: 'SEMI', value: ';' },
  { type: 'RBRACE', value: '}' },
];

const TOKEN_COLORS = {
  KEYWORD: '#e05c3a',
  IDENT: '#5090d8',
  NUMBER: '#3a8a8a',
  OP: '#9c9890',
  LPAREN: '#6b6760',
  RPAREN: '#6b6760',
  LBRACE: '#6b6760',
  RBRACE: '#6b6760',
  COMMA: '#6b6760',
  SEMI: '#6b6760',
};

/* ── Particles (CSS-only) ──────────────────────────────────────────── */
function Particles() {
  return (
    <div className={styles.particles} aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className={styles.particle}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 8}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: 0.15 + Math.random() * 0.25,
          }}
        />
      ))}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function HeroSection() {
  const line1 = ['Break', 'your', 'code.'];
  const line2 = ['On', 'purpose.'];

  return (
    <section className={styles.hero}>
      {/* Noise overlay */}
      <div className={styles.noise} aria-hidden />
      <Particles />

      <div className={styles.content}>
        {/* Heading line 1 */}
        <h1 className={styles.heading}>
          <span className={styles.headingLine}>
            {line1.map((word, i) => (
              <motion.span
                key={`l1-${i}`}
                className={styles.word}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className={styles.headingLine}>
            {line2.map((word, i) => (
              <motion.span
                key={`l2-${i}`}
                className={styles.word}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: 0.3 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Chaos Compiler parses C/C++ into an AST and deliberately mutates it
          — so you can see exactly where your code is fragile.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className={styles.ctas}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
          {[...TICKER_TOKENS, ...TICKER_TOKENS, ...TICKER_TOKENS].map((t, i) => (
            <span
              key={i}
              className={styles.token}
              style={{ '--token-color': TOKEN_COLORS[t.type] || '#6b6760' }}
            >
              <span className={styles.tokenValue}>{t.value}</span>
              <span className={styles.tokenType}>{t.type}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
