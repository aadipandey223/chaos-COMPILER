import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AST_BUILD_STEPS, CODEGEN_STEPS } from '../../../utils/tutorialData';
import styles from './CodegenStage.module.css';

const NODE_POS = Object.fromEntries(AST_BUILD_STEPS.map(n => [n.id, { x: n.x, y: n.y, type: n.type, value: n.value }]));

export default function CodegenStage({ step, speed, playing, onStepComplete }) {
  const maxStep = CODEGEN_STEPS.length - 1;
  const currentStep = Math.min(step, maxStep);

  // Typewriter state for the current line
  const [typedChars, setTypedChars] = useState(0);
  const typeRef = useRef(null);
  const prevStep = useRef(-1);

  const currentLine = CODEGEN_STEPS[currentStep]?.output || '';

  // Reset typewriter when step changes
  useEffect(() => {
    if (prevStep.current !== currentStep) {
      prevStep.current = currentStep;
      setTypedChars(0);
    }
  }, [currentStep]);

  // Typewriter effect
  useEffect(() => {
    if (typedChars >= currentLine.length) return;
    const delay = 30 / speed;
    typeRef.current = setTimeout(() => setTypedChars(c => c + 1), delay);
    return () => clearTimeout(typeRef.current);
  }, [typedChars, currentLine, speed]);

  // Advance step once typewriter finishes (when playing)
  useEffect(() => {
    if (!playing || typedChars < currentLine.length || currentStep >= maxStep) return;
    const t = setTimeout(onStepComplete, 400 / speed);
    return () => clearTimeout(t);
  }, [playing, typedChars, currentLine.length, currentStep, maxStep, speed, onStepComplete]);

  // All fully-emitted lines (previous steps)
  const emittedLines = useMemo(
    () => CODEGEN_STEPS.slice(0, currentStep).map(s => s.output),
    [currentStep]
  );

  const activeNodeId = CODEGEN_STEPS[currentStep]?.nodeId;

  const W = 680, H = 460;

  return (
    <div className={styles.stage}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Code Generation — AST → C source</span>
        <span className={styles.headerCount}>Step {currentStep + 1} / {CODEGEN_STEPS.length}</span>
      </div>

      <div className={styles.body}>
        {/* AST panel (dark) */}
        <div className={styles.treePanel}>
          <div className={styles.treePanelLabel}>AST</div>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
            {/* Edges */}
            {AST_BUILD_STEPS.map(node => {
              if (!node.parent) return null;
              const parent = NODE_POS[node.parent];
              if (!parent) return null;
              return (
                <line
                  key={`edge-${node.id}`}
                  x1={parent.x} y1={parent.y + 20}
                  x2={node.x}   y2={node.y - 20}
                  stroke="#2a2a2a"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Nodes */}
            {AST_BUILD_STEPS.map(node => {
              const isActive = node.id === activeNodeId;
              const isPast = CODEGEN_STEPS.slice(0, currentStep).some(s => s.nodeId === node.id);

              const fill   = isActive ? '#1a2a1a' : isPast ? '#1a1a2a' : '#111';
              const stroke = isActive ? 'var(--accent)' : isPast ? '#3a6a9e' : '#2a2a2a';

              return (
                <g key={node.id}>
                  <rect
                    x={node.x - 55} y={node.y - 18}
                    width={110} height={36}
                    rx={6}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isActive ? 2 : 1}
                    style={isActive ? { filter: 'drop-shadow(0 0 6px var(--accent))' } : {}}
                  />
                  <text
                    x={node.x} y={node.y - 3}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isActive ? '#e2e8f0' : '#888'}
                    fontFamily="var(--font-code)"
                  >
                    {node.type}
                  </text>
                  {node.value && (
                    <text
                      x={node.x} y={node.y + 11}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isActive ? '#94a3b8' : '#555'}
                      fontFamily="var(--font-code)"
                    >
                      {node.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Generated code panel */}
        <div className={styles.codePanel}>
          <div className={styles.codePanelLabel}>Generated C</div>
          <div className={styles.codeOutput}>
            {emittedLines.map((line, i) => (
              <div key={i} className={styles.codeLine}>
                <span className={styles.lineNum}>{i + 1}</span>
                <span className={styles.lineText}>{line}</span>
              </div>
            ))}
            {/* Current line with typewriter */}
            <div className={`${styles.codeLine} ${styles.codeLineActive}`}>
              <span className={styles.lineNum}>{emittedLines.length + 1}</span>
              <span className={styles.lineText}>
                {currentLine.slice(0, typedChars)}
                <motion.span
                  className={styles.cursor}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                >
                  |
                </motion.span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
