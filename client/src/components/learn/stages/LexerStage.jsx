import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, DFA_STATES, DFA_TRANSITIONS, TOKEN_DFA_STATE, SOURCE } from '../../../utils/tutorialData';
import styles from './LexerStage.module.css';

const TOKEN_COLORS = {
  KEYWORD: 'var(--accent)',
  IDENT:   'var(--info)',
  NUMBER:  'var(--node-literal)',
  default: 'var(--text-tertiary)',
};

function tokenColor(type) {
  return TOKEN_COLORS[type] || TOKEN_COLORS.default;
}

function DfaDiagram({ activeState }) {
  const stateMap = Object.fromEntries(DFA_STATES.map(s => [s.id, s]));
  const W = 620, H = 260;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.dfaSvg}>
      {/* Edges */}
      {DFA_TRANSITIONS.map((t, i) => {
        const from = stateMap[t.from];
        const to   = stateMap[t.to];
        if (!from || !to) return null;
        const isSelf = t.from === t.to;
        if (isSelf) {
          return (
            <g key={i}>
              <path
                d={`M${from.x},${from.y - 24} C${from.x - 30},${from.y - 60} ${from.x + 30},${from.y - 60} ${from.x},${from.y - 24}`}
                fill="none" stroke="var(--surface-3)" strokeWidth="1.5"
              />
              <text x={from.x} y={from.y - 68} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">{t.label}</text>
            </g>
          );
        }
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 18;
        return (
          <g key={i}>
            <line x1={from.x + 24} y1={from.y} x2={to.x - 24} y2={to.y} stroke="var(--surface-3)" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <text x={mx} y={my} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">{t.label}</text>
          </g>
        );
      })}

      {/* Arrow marker */}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--surface-3)" />
        </marker>
      </defs>

      {/* Nodes */}
      {DFA_STATES.map(s => {
        const isActive = s.id === activeState;
        const isAccept = s.id === 'ACCEPT';
        return (
          <g key={s.id}>
            <circle
              cx={s.x} cy={s.y} r={24}
              fill={isActive ? 'var(--accent-light)' : 'var(--surface-1)'}
              stroke={isActive ? 'var(--accent)' : 'var(--surface-3)'}
              strokeWidth={isActive ? 2 : 1.5}
              style={isActive ? { filter: 'drop-shadow(0 0 8px var(--accent))' } : {}}
            />
            {isAccept && (
              <circle cx={s.x} cy={s.y} r={20} fill="none" stroke="var(--surface-3)" strokeWidth="1" />
            )}
            <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="11" fontWeight="600"
              fill={isActive ? 'var(--accent)' : 'var(--text-secondary)'}
              fontFamily="var(--font-code)"
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function LexerStage({ step, speed, playing, onStepComplete }) {
  const maxStep = TOKENS.length - 1;
  const currentStep = Math.min(step, maxStep);
  const token = TOKENS[currentStep];
  const activeState = token ? TOKEN_DFA_STATE[token.type] || 'START' : 'START';
  const visibleTokens = TOKENS.slice(0, currentStep + 1);
  const streamRef = useRef(null);

  // Auto-play
  useEffect(() => {
    if (!playing || currentStep >= maxStep) return;
    const delay = 800 / speed;
    const t = setTimeout(onStepComplete, delay);
    return () => clearTimeout(t);
  }, [playing, currentStep, speed, onStepComplete, maxStep]);

  // Auto-scroll token stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollLeft = streamRef.current.scrollWidth;
    }
  }, [visibleTokens.length]);

  const sourceLines = SOURCE.split('\n');

  return (
    <div className={styles.stage}>
      <div className={styles.panels}>
        {/* Source code panel */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Source code</div>
          <div className={styles.sourceCode}>
            {sourceLines.map((line, li) => {
              const lineNum = li + 1;
              const isActive = token && token.line === lineNum;
              return (
                <div key={li} className={`${styles.sourceLine} ${isActive ? styles.sourceLineActive : ''}`}>
                  <span className={styles.sourceLineNum}>{lineNum}</span>
                  <span className={styles.sourceLineText}>{line || ' '}</span>
                </div>
              );
            })}
          </div>
          {token && (
            <div className={styles.currentChar}>
              Current token: <span style={{ color: tokenColor(token.type), fontFamily: 'var(--font-code)' }}>
                {token.value || 'EOF'}
              </span>
              <span className={styles.tokenTypeBadge} style={{ color: tokenColor(token.type) }}>
                {token.type}
              </span>
            </div>
          )}
        </div>

        {/* DFA panel */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>DFA — Deterministic Finite Automaton</div>
          <div className={styles.dfaWrap}>
            <DfaDiagram activeState={activeState} />
          </div>
          <div className={styles.dfaNote}>
            Active state: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-code)' }}>{activeState}</strong>
          </div>
        </div>
      </div>

      {/* Token stream */}
      <div className={styles.streamWrap}>
        <div className={styles.streamLabel}>Token stream</div>
        <div className={styles.stream} ref={streamRef}>
          <AnimatePresence>
            {visibleTokens.map((t, i) => (
              <motion.span
                key={i}
                className={styles.tokenPill}
                style={{ color: tokenColor(t.type), borderColor: tokenColor(t.type) + '44', background: tokenColor(t.type) + '18' }}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className={styles.pillValue}>{t.value || 'EOF'}</span>
                <span className={styles.pillType}>{t.type}</span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
