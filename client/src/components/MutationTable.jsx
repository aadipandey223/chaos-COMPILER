import React, { useState } from 'react';
import styles from './MutationTable.module.css';

const TYPE_COLORS = {
  OPERATOR_MUTATION:  '#7a3a9e',
  CONDITION_FLIP:     '#9e8a3a',
  LITERAL_SHIFT:      '#3a8a8a',
  RETURN_SWAP:        '#9e3a3a',
  DEAD_CODE_INJECT:   '#3a6a9e',
};

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

const MutationTable = ({ mutations }) => {
  const [filter, setFilter] = useState('All');

  if (!mutations || mutations.length === 0) {
    return (
      <div className={styles.empty}>
        No mutations logged yet.<br />
        Try compiling with medium or high intensity.
      </div>
    );
  }

  // Unique types for filter pills
  const allTypes = ['All', ...Array.from(new Set(mutations.map(m => m.type).filter(Boolean)))];

  const filtered = filter === 'All'
    ? mutations
    : mutations.filter(m => m.type === filter);

  const uniqueTypes = new Set(mutations.map(m => m.type));

  const handleExportJSON = () => {
    downloadBlob(JSON.stringify(mutations, null, 2), 'mutations.json', 'application/json');
  };

  const handleExportCSV = () => {
    const rows = [
      ['type', 'line', 'before', 'after'].map(escapeCSV).join(','),
      ...mutations.map(m =>
        [m.type, m.line, m.before, m.after].map(escapeCSV).join(',')
      ),
    ];
    downloadBlob(rows.join('\n'), 'mutations.csv', 'text/csv');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {/* Filter pills */}
        <div className={styles.filters}>
          {allTypes.map(type => (
            <button
              key={type}
              className={`${styles.pill} ${filter === type ? styles.pillActive : ''}`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Export buttons */}
        <div className={styles.exportBtns}>
          <button className={styles.exportBtn} onClick={handleExportJSON}>
            Export JSON
          </button>
          <button className={styles.exportBtn} onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
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
          {filtered.map((m, i) => {
            const color = TYPE_COLORS[m.type] || '#888580';
            return (
              <tr key={i}>
                <td style={{ color: '#888580' }}>{i + 1}</td>
                <td>
                  <span className={styles.badge} style={{ color }}>
                    {m.type}
                  </span>
                </td>
                <td className={styles.lineNum}>{m.line ?? '—'}</td>
                <td className={styles.before}>{m.before || '—'}</td>
                <td className={styles.after}>{m.after  || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className={styles.summary}>
        {mutations.length} mutation{mutations.length !== 1 ? 's' : ''} applied · {uniqueTypes.size} unique type{uniqueTypes.size !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default MutationTable;
