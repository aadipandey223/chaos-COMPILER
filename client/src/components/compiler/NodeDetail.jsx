import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './NodeDetail.module.css';

const NodeDetail = ({ node }) => {
  return (
    <div className={styles.panel}>
      <AnimatePresence mode="wait">
        {!node ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <p className={styles.placeholder}>
              Click any node in the tree to inspect it.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={node.meta.id || JSON.stringify(node)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={styles.content}
          >
            {/* 1. PANEL HEADER */}
            <div className={styles.header}>
              <h3 className={styles.nodeType}>{node.meta.type}</h3>
              {node.meta.alias && (
                <div className={styles.alias}>{node.meta.alias}</div>
              )}
            </div>

            {/* 2. SECTION: LOCATION & CONTEXT */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Location & Context</h4>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td>Line</td>
                    <td>{node.meta.line || '�'}</td>
                  </tr>
                  <tr>
                    <td>Col span</td>
                    <td>
                      {node.meta.colStart && node.meta.colEnd
                        ? `${node.meta.colStart} -> ${node.meta.colEnd}`
                        : '�'}
                    </td>
                  </tr>
                  {node.meta.parentType && (
                    <tr>
                      <td>Parent</td>
                      <td>
                        <span className={styles.parentBadge}>
                          {node.meta.parentType}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. SECTION: SOURCE SNIPPET */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Source Snippet</h4>
              {node.meta.snippet ? (
                <pre className={styles.snippetBlock}>
                  <code>{node.meta.snippet}</code>
                </pre>
              ) : (
                <div className={styles.emptyVal}>None</div>
              )}
            </div>

            {/* 4. SECTION: NODE DETAILS (context cards) */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Details</h4>
              {node.meta.context && Object.keys(node.meta.context).length > 0 ? (
                <div className={styles.cardGrid}>
                  {Object.entries(node.meta.context).map(([key, val]) => (
                    <div className={styles.contextCard} key={key}>
                      <span className={styles.cardKey}>{key}</span>
                      <span className={styles.cardVal}>{val || '�'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyVal}>None</div>
              )}
            </div>

            {/* 5. SECTION: CHILD NODES */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Children</h4>
              {node.meta.directChildren && node.meta.directChildren.length > 0 ? (
                <ul className={styles.childList}>
                  {node.meta.directChildren.map((child, i) => (
                    <li key={i} className={styles.childItem}>
                      <span className={styles.childBadge}>{child.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyVal}>No children</div>
              )}
            </div>

            {/* 6. SECTION: MUTATION APPLIED */}
            {node.meta.mutated && node.meta.mutation && (
              <div className={styles.mutationSection}>
                <h4 className={styles.mutationTitle}>Mutation Applied</h4>
                <div className={styles.mutationBox}>
                  <strong>{node.meta.mutation.type}</strong>
                  <div className={styles.mutationDiff}>
                    <span className={styles.mutOld}>{node.meta.mutation.oldVal}</span>
                    <span className={styles.mutArrow}>→</span>
                    <span className={styles.mutNew}>{node.meta.mutation.newVal}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NodeDetail;
