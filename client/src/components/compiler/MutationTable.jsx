import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';
import styles from './MutationTable.module.css';

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCSV(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export default function MutationTable({ mutations }) {
  const [filter, setFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const navigate = useNavigate();

  if (!mutations || mutations.length === 0) {
    return (
      <motion.div className={styles.empty} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        No mutations logged yet.<br />
        Try compiling with medium or high intensity.
      </motion.div>
    );
  }

  const allTypes = ['All', ...Array.from(new Set(mutations.map(m => m.type).filter(Boolean)))];
  const filtered = filter === 'All' ? mutations : mutations.filter(m => m.type === filter);
  const uniqueTypes = new Set(mutations.map(m => m.type));

  const handleExportJSON = () =>
    downloadBlob(JSON.stringify(mutations, null, 2), 'mutations.json', 'application/json');

  const handleExportCSV = () => {
    const rows = [
      ['type', 'line', 'before', 'after'].map(escapeCSV).join(','),
      ...mutations.map(m => [m.type, m.line, m.before, m.after].map(escapeCSV).join(',')),
    ];
    downloadBlob(rows.join('\n'), 'mutations.csv', 'text/csv');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {allTypes.map((type, i) => {
            const isActive = filter === type;
            return (
              <motion.button
                key={type}
                className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
                onClick={() => setFilter(type)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="pillBg"
                    className={styles.pillBg}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{type}</span>
              </motion.button>
            );
          })}
        </div>
        <div className={styles.exportBtns}>
          <motion.button className={styles.exportBtn} onClick={handleExportJSON} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            JSON ↓
          </motion.button>
          <motion.button className={styles.exportBtn} onClick={handleExportCSV} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            CSV ↓
          </motion.button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>TYPE</th>
              <th>LINE</th>
              <th>BEFORE</th>
              <th>AFTER</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((m, i) => {
                const isExpanded = expandedRow === i;
                return (
                  <React.Fragment key={i}>
                    <motion.tr
                      className={styles.row}
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                      title="Click to view details"
                      initial={{ opacity: 0, scale: 0.98, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.01 + 0.1, duration: 0.2 }}
                    >
                      <td className={styles.num}>{i + 1}</td>
                      <td><Badge mutationType={m.type} /></td>
                      <td className={styles.line}>{m.line ?? '—'}</td>
                      <td className={styles.code}>{m.before || '—'}</td>
                      <td className={styles.code}>{m.after  || '—'}</td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className={styles.expandedContent}>
                                <div style={{ marginBottom: '8px' }}><b>Before:</b> <code>{m.before}</code></div>
                                <div><b>After:</b> <code>{m.after}</code></div>
                                <button className={styles.viewDiffBtn} onClick={(e) => { e.stopPropagation(); navigate('/app/diff'); }}>
                                  View in Diff
                                </button>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className={styles.summary}>
        {mutations.length} mutation{mutations.length !== 1 ? 's' : ''} · {uniqueTypes.size} unique type{uniqueTypes.size !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
