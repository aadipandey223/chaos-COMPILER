import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AST_BUILD_STEPS, SEMANTIC_STEPS, SYMBOL_TABLE_STEPS } from '../../../utils/tutorialData';
import styles from './SemanticStage.module.css';

const RESULT_COLOR = {
  ok:    'var(--success)',
  warn:  'var(--warning)',
  error: 'var(--error)',
};

const RESULT_LABEL = {
  ok:    '✓',
  warn:  '⚠',
  error: '✗',
};

// Build a lookup: nodeId → position from AST_BUILD_STEPS
const NODE_POS = Object.fromEntries(AST_BUILD_STEPS.map(n => [n.id, { x: n.x, y: n.y, type: n.type, value: n.value }]));

export default function SemanticStage({ step, speed, playing, onStepComplete }) {
  const maxStep = SEMANTIC_STEPS.length - 1;
  const currentStep = Math.min(step, maxStep);

  useEffect(() => {
    if (!playing || currentStep >= maxStep) return;
    const t = setTimeout(onStepComplete, 800 / speed);
    return () => clearTimeout(t);
  }, [playing, currentStep, speed, onStepComplete, maxStep]);

  // Which nodes have been visited so far
  const visitedIds = useMemo(
    () => new Set(SEMANTIC_STEPS.slice(0, currentStep + 1).map(s => s.nodeId)),
    [currentStep]
  );

  const activeStep = SEMANTIC_STEPS[currentStep];

  // Symbol table entries visible so far
  const visibleSymbols = useMemo(
    () => SYMBOL_TABLE_STEPS.filter(s => s.step <= currentStep + 1).map(s => s.entry),
    [currentStep]
  );

  const W = 680, H = 460;

  return (
    <div className={styles.stage}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Semantic Analysis — type checking &amp; scope resolution</span>
        <span className={styles.headerCount}>Step {currentStep + 1} / {SEMANTIC_STEPS.length}</span>
      </div>

      <div className={styles.body}>
        {/* AST with scanner beam */}
        <div className={styles.treePanel}>
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
                  stroke="var(--code-border)"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Scanner beam on active node */}
            {activeStep && NODE_POS[activeStep.nodeId] && (
              <motion.rect
                key={`beam-${currentStep}`}
                x={NODE_POS[activeStep.nodeId].x - 62}
                y={NODE_POS[activeStep.nodeId].y - 24}
                width={124}
                height={44}
                rx={8}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.25 }}
                style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
              />
            )}

            {/* Nodes */}
            {AST_BUILD_STEPS.map(node => {
              const visited = visitedIds.has(node.id);
              const isActive = activeStep?.nodeId === node.id;
              const result = visited
                ? (SEMANTIC_STEPS.find(s => s.nodeId === node.id)?.result || 'ok')
                : null;

              const fillColor = isActive
                ? 'var(--accent-subtle)'
                : visited
                  ? (result === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)')
                  : 'var(--code-bg)';

              const strokeColor = isActive
                ? 'var(--accent)'
                : visited
                  ? RESULT_COLOR[result]
                  : 'var(--code-border)';

              return (
                <g key={node.id}>
                  <rect
                    x={node.x - 55} y={node.y - 18}
                    width={110} height={36}
                    rx={6}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={node.x} y={node.y - 3}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--code-text)"
                    fontFamily="var(--font-code)"
                  >
                    {node.type}
                  </text>
                  {node.value && (
                    <text
                      x={node.x} y={node.y + 11}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--code-muted)"
                      fontFamily="var(--font-code)"
                    >
                      {node.value}
                    </text>
                  )}
                  {/* Result badge */}
                  {visited && (
                    <text
                      x={node.x + 50} y={node.y - 10}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill={RESULT_COLOR[result]}
                    >
                      {RESULT_LABEL[result]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right panel: note + symbol table */}
        <div className={styles.infoPanel}>
          {/* Current note */}
          <div className={styles.noteCard}>
            <div className={styles.noteLabel}>Analysis note</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                className={styles.noteText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {activeStep?.note || '—'}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Symbol table */}
          <div className={styles.symbolTable}>
            <div className={styles.symbolTableTitle}>Symbol Table</div>
            {visibleSymbols.length === 0 ? (
              <div className={styles.symbolEmpty}>No symbols yet</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {visibleSymbols.map((sym, i) => (
                      <motion.tr
                        key={`${sym.name}-${sym.scope}`}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <td className={styles.symName}>{sym.name}</td>
                        <td className={styles.symType}>{sym.type}</td>
                        <td className={styles.symScope}>{sym.scope}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
