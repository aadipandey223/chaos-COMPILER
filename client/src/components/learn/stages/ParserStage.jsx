import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, PARSE_STEPS } from '../../../utils/tutorialData';
import styles from './ParserStage.module.css';

export default function ParserStage({ step, speed, playing, onStepComplete }) {
  const maxStep = PARSE_STEPS.length - 1;
  const currentStep = Math.min(step, maxStep);
  const current = PARSE_STEPS[currentStep];
  const visibleSteps = PARSE_STEPS.slice(0, currentStep + 1);

  useEffect(() => {
    if (!playing || currentStep >= maxStep) return;
    const t = setTimeout(onStepComplete, 900 / speed);
    return () => clearTimeout(t);
  }, [playing, currentStep, speed, onStepComplete, maxStep]);

  // Find active token index
  const activeTokenIdx = current?.token
    ? TOKENS.findIndex(t => t.value === current.token)
    : -1;

  return (
    <div className={styles.stage}>
      {/* Token stream */}
      <div className={styles.tokenStream}>
        <div className={styles.panelTitle}>Token stream</div>
        <div className={styles.tokens}>
          {TOKENS.slice(0, 12).map((t, i) => (
            <span
              key={i}
              className={`${styles.token} ${i === activeTokenIdx ? styles.tokenActive : ''}`}
            >
              {t.value || 'EOF'}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.panels}>
        {/* Grammar rules */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Grammar rules</div>
          <div className={styles.rules}>
            {visibleSteps.map((s, i) => (
              <motion.div
                key={i}
                className={`${styles.rule} ${i === currentStep ? styles.ruleActive : ''}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {i === currentStep && <span className={styles.ruleArrow}>►</span>}
                <span className={styles.ruleText}>{s.rule}</span>
                {i < currentStep && <span className={styles.ruleCheck}>✓</span>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call stack */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Call stack</div>
          <div className={styles.stack}>
            <AnimatePresence>
              {visibleSteps.map((s, i) => (
                <motion.div
                  key={i}
                  className={`${styles.frame} ${i === currentStep ? styles.frameActive : ''}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {i === currentStep && <span className={styles.frameMarker}>►</span>}
                  <span className={styles.frameFn}>{s.fn}</span>
                  {s.token && (
                    <span className={styles.frameToken}>{s.token}</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
