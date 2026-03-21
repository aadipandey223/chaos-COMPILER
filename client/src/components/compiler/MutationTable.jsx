import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  if (!mutations || mutations.length === 0) {
    return (
      <div className={styles.empty}>
        No mutations logged yet.<br />
        Try compiling with medium or high intensity.
      </div>
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
        <div className={styles.exportBtns}>
          <button className={styles.exportBtn} onClick={handleExportJSON}>JSON ↓</button>
          <button className={styles.exportBtn} onClick={handleExportCSV}>CSV ↓</button>
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
            {filtered.map((m, i) => (
              <tr
                key={i}
                className={styles.row}
                onClick={() => navigate('/app/diff')}
                title="View in diff"
              >
                <td className={styles.num}>{i + 1}</td>
                <td><Badge mutationType={m.type} /></td>
                <td className={styles.line}>{m.line ?? '—'}</td>
                <td className={styles.code}>{m.before || '—'}</td>
                <td className={styles.code}>{m.after  || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summary}>
        {mutations.length} mutation{mutations.length !== 1 ? 's' : ''} · {uniqueTypes.size} unique type{uniqueTypes.size !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
