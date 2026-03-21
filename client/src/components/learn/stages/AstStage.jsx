import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AST_BUILD_STEPS } from '../../../utils/tutorialData';
import styles from './AstStage.module.css';

const NODE_COLORS = {
  Program:  { fill: '#1a1a1a', stroke: '#3a3a3a' },
  FuncDecl: { fill: '#1a2a1a', stroke: '#3a9e6e' },
  VarDecl:  { fill: '#1a1a2a', stroke: '#3a6a9e' },
  Block:    { fill: '#1a1a1a', stroke: '#3a3a3a' },
  If:       { fill: '#2a2a1a', stroke: '#9e8a3a' },
  BinaryOp: { fill: '#2a1a2a', stroke: '#7a3a9e' },
  Ident:    { fill: '#1a2a2a', stroke: '#3a8a8a' },
  Number:   { fill: '#1a2a2a', stroke: '#3a8a8a' },
  Return:   { fill: '#2a1a1a', stroke: '#9e3a3a' },
};

function nodeColor(type) {
  return NODE_COLORS[type] || { fill: '#1a1a1a', stroke: '#444' };
}

export default function AstStage({ step, speed, playing, onStepComplete }) {
  const maxStep = AST_BUILD_STEPS.length - 1;
  const currentStep = Math.min(step, maxStep);
  const visibleNodes = AST_BUILD_STEPS.slice(0, currentStep + 1);
  const nodeMap = Object.fromEntries(AST_BUILD_STEPS.map(n => [n.id, n]));

  useEffect(() => {
    if (!playing || currentStep >= maxStep) return;
    const t = setTimeout(onStepComplete, 700 / speed);
    return () => clearTimeout(t);
  }, [playing, currentStep, speed, onStepComplete, maxStep]);

  const W = 680, H = 500;

  return (
    <div className={styles.stage}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Building the AST — node by node</span>
        <span className={styles.headerCount}>{visibleNodes.length} / {AST_BUILD_STEPS.length} nodes</span>
      </div>
      <div className={styles.canvas}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
          {/* Edges */}
          {visibleNodes.map(node => {
            if (!node.parent) return null;
            const parent = nodeMap[node.parent];
            if (!parent || !visibleNodes.find(n => n.id === node.parent)) return null;
            return (
              <motion.line
                key={`edge-${node.id}`}
                x1={parent.x} y1={parent.y + 20}
                x2={node.x}   y2={node.y - 20}
                stroke="var(--code-border)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}

          {/* Nodes */}
          <AnimatePresence>
            {visibleNodes.map((node, i) => {
              const { fill, stroke } = nodeColor(node.type);
              const isLatest = i === visibleNodes.length - 1;
              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: isLatest ? 1 : 0.85, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <rect
                    x={node.x - 55} y={node.y - 18}
                    width={110} height={36}
                    rx={6}
                    fill={fill}
                    stroke={isLatest ? 'var(--accent)' : stroke}
                    strokeWidth={isLatest ? 2 : 1}
                    style={isLatest ? { filter: 'drop-shadow(0 0 6px var(--accent))' } : {}}
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
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>

      {/* Current node info */}
      {visibleNodes.length > 0 && (
        <div className={styles.nodeInfo}>
          <span className={styles.nodeInfoLabel}>Added:</span>
          <span className={styles.nodeInfoType} style={{ color: nodeColor(visibleNodes[visibleNodes.length - 1].type).stroke }}>
            {visibleNodes[visibleNodes.length - 1].type}
          </span>
          {visibleNodes[visibleNodes.length - 1].value && (
            <span className={styles.nodeInfoValue}>
              "{visibleNodes[visibleNodes.length - 1].value}"
            </span>
          )}
          {visibleNodes[visibleNodes.length - 1].parent && (
            <span className={styles.nodeInfoParent}>
              → child of {visibleNodes[visibleNodes.length - 1].parent}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
