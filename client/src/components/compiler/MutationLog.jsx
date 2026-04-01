import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompiler } from '../../store/useCompilerStore';

const TYPE_COLORS = {
  VARIABLE_SWAP:      { bg: 'rgba(83,74,183,.12)',  color: '#534AB7' },
  DEAD_CODE_INJECT:   { bg: 'rgba(30,150,90,.1)',   color: '#1a8a5a' },
  STATEMENT_DELETION: { bg: 'rgba(220,50,50,.1)',   color: '#b83232' },
  CONDITION_FLIP:     { bg: 'rgba(186,117,23,.12)', color: '#7a4e0a' },
  OPERATOR_MUTATION:  { bg: 'rgba(212,82,42,.12)',  color: '#c94c24' },
  OFF_BY_ONE:         { bg: 'rgba(100,100,220,.1)', color: '#3355bb' },
  NULL_INJECTION:     { bg: 'rgba(220,50,50,.1)',   color: '#b83232' },
  BOOLEAN_INVERSION:  { bg: 'rgba(83,74,183,.12)',  color: '#534AB7' },
  LOOP_BOUND_CHANGE:  { bg: 'rgba(186,117,23,.12)', color: '#7a4e0a' }
};

const TYPE_HINTS = {
  OPERATOR_MUTATION:  "If tests pass: the computed value is never directly asserted.",
  CONDITION_FLIP:     "If tests pass: neither branch of this condition is covered.",
  LITERAL_SHIFT:      "If tests pass: the exact literal value is never verified.",
  STATEMENT_DELETION: "High impact — if tests pass, this statement was never asserted on.",
  DEAD_CODE_INJECT:   "Low impact. Dead code never runs — coverage % may drop slightly.",
  VARIABLE_SWAP:      "If tests pass: commutative operand order is untested.",
  OFF_BY_ONE:         "Boundary condition is not covered by any test.",
  NULL_INJECTION:     "Return value of this call is never checked.",
  BOOLEAN_INVERSION:  "Both branches of this condition are untested.",
  LOOP_BOUND_CHANGE:  "Loop termination condition is not asserted."
};

function scoreColor(s) {
  if (s >= 8) return '#c94c24';
  if (s >= 5) return '#b87a10';
  return '#1a8a5a';
}

export default function MutationLog() {
  const { state } = useCompiler();
  const mutations = state.mutations || [];

  const [filter, setFilter] = useState('all');
  const [sortDesc, setSortDesc] = useState(true);
  const [openRow, setOpenRow] = useState(null);

  const total = mutations.length;
  let sumScore = 0;
  let lowCount = 0;
  let medCount = 0;
  let highCount = 0;
  const types = new Set();
  
  mutations.forEach(m => {
    sumScore += (m.score || 0);
    if (m.score <= 3) lowCount++;
    else if (m.score <= 6) medCount++;
    else highCount++;
    if (m.type) types.add(m.type);
  });
  
  const avgScore = total > 0 ? (sumScore / total) : 0;
  const chaosScore = Math.round((avgScore / 10) * 100);
  
  const maxCount = Math.max(lowCount, medCount, highCount) || 1;
  const hLow = `${(lowCount / maxCount) * 100}%`;
  const hMed = `${(medCount / maxCount) * 100}%`;
  const hHigh = `${(highCount / maxCount) * 100}%`;

  const typeCounts = Array.from(types).map(type => ({
      type, 
      count: mutations.filter(m => m.type === type).length
  }));

  const filtered = useMemo(() => {
    let res = filter === 'all' ? [...mutations] : mutations.filter(m => m.type === filter);
    res.sort((a, b) => {
       const scoreA = a.score || 0;
       const scoreB = b.score || 0;
       return sortDesc ? scoreB - scoreA : scoreA - scoreB;
    });
    return res;
  }, [mutations, filter, sortDesc]);

  const handleFilter = (f) => {
    setFilter(f);
    setOpenRow(null);
  };

  const toggleSort = () => {
    setSortDesc(!sortDesc);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'mutations.json'; a.click();
  };

  const handleExportCSV = () => {
    const rows = [['id', 'type', 'line', 'before', 'after', 'score', 'pass', 'description'], ...filtered.map(m => [
        m.id || '', m.type || '', m.line || '', m.before || '', m.after || '', m.score || '', m.pass || '', m.description || ''
    ])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'mutations.csv'; a.click();
  };

  const renderChange = (m) => {
    if (m.type === 'STATEMENT_DELETION') {
      return (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
          <span style={{ color: '#b83232' }}>{m.before}</span>
          <span style={{ color: 'var(--text-tertiary, #888)', margin: '0 6px' }}>→</span>
          <span style={{ color: '#1a8a5a', fontWeight: 500 }}>(deleted)</span>
        </span>
      );
    }
    if (m.type === 'DEAD_CODE_INJECT') {
      return (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary, #666)' }}>—</span>
          <span style={{ color: 'var(--text-tertiary, #888)', margin: '0 6px' }}>→</span>
          <span style={{ color: '#1a8a5a', fontWeight: 500 }}>{m.after}</span>
        </span>
      );
    }
    return (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-secondary, #666)' }}>{m.before}</span>
        <span style={{ color: 'var(--text-tertiary, #888)', margin: '0 6px' }}>→</span>
        <span style={{ color: '#c94c24', fontWeight: 500 }}>{m.after}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body, sans-serif)', color: 'var(--text-primary)' }}>
      {/* SECTION 1 — TOP STATS BAR */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '10px', padding: '12px 16px', border: '0.5px solid var(--surface-3, #333)', minWidth: '130px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #888)', marginBottom: '4px' }}>Chaos score</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary, #fff)', lineHeight: 1 }}>{chaosScore}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #bbb)', marginTop: '3px' }}>out of 100</div>
        </div>
        <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '10px', padding: '12px 16px', border: '0.5px solid var(--surface-3, #333)', minWidth: '130px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #888)', marginBottom: '4px' }}>Mutations</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary, #fff)', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #bbb)', marginTop: '3px' }}>{types.size} unique types</div>
        </div>
        <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '10px', padding: '12px 16px', border: '0.5px solid var(--surface-3, #333)', minWidth: '130px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #888)', marginBottom: '4px' }}>Avg impact</div>
          <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-primary, #fff)', lineHeight: 1 }}>{avgScore.toFixed(1)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #bbb)', marginTop: '3px' }}>out of 10</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface-2, #1e1e1e)', borderRadius: '10px', padding: '12px 16px', border: '0.5px solid var(--surface-3, #333)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #bbb)', marginBottom: '6px' }}>Impact distribution</div>
          <div style={{ display: 'flex', gap: '4px', height: '28px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, background: '#1a8a5a', opacity: 0.35, borderRadius: '3px 3px 0 0', height: hLow }}></div>
            <div style={{ flex: 1, background: '#d4522a', opacity: 0.5, borderRadius: '3px 3px 0 0', height: hMed }}></div>
            <div style={{ flex: 1, background: '#d4522a', borderRadius: '3px 3px 0 0', height: hHigh }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary, #888)', marginTop: '4px' }}>
            <span>low (1-3)</span>
            <span>med (4-6)</span>
            <span>high (7-10)</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — FILTER PILLS + CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => handleFilter('all')}
          style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all .15s',
            border: filter === 'all' ? '0.5px solid #d4522a' : '0.5px solid var(--surface-3, #333)',
            background: filter === 'all' ? '#d4522a' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--text-secondary, #bbb)'
          }}
        >
          All <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 500 }}>{total}</span>
        </button>
        {typeCounts.map(tc => (
          <button 
            key={tc.type}
            onClick={() => handleFilter(tc.type)}
            style={{
              fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all .15s',
              border: filter === tc.type ? '0.5px solid #d4522a' : '0.5px solid var(--surface-3, #333)',
              background: filter === tc.type ? '#d4522a' : 'transparent',
              color: filter === tc.type ? '#fff' : 'var(--text-secondary, #bbb)'
            }}
          >
            {tc.type} <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 500 }}>{tc.count}</span>
          </button>
        ))}
        
        <div style={{ flex: 1 }}></div>
        
        <button onClick={toggleSort} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid var(--surface-3, #333)', cursor: 'pointer', color: 'var(--text-secondary, #bbb)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Score <span>{sortDesc ? '↓' : '↑'}</span>
        </button>
        <button onClick={handleExportJSON} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid var(--surface-3, #333)', cursor: 'pointer', color: 'var(--text-secondary, #bbb)', background: 'transparent' }}>JSON ↓</button>
        <button onClick={handleExportCSV} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid var(--surface-3, #333)', cursor: 'pointer', color: 'var(--text-secondary, #bbb)', background: 'transparent' }}>CSV ↓</button>
      </div>

      {/* SECTION 3 — LOG TABLE */}
      <div style={{ border: '0.5px solid var(--surface-3, #333)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-2, #1e1e1e)' }}>
              <tr>
                <th style={{ width: '32px', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary, #888)', padding: '8px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', letterSpacing: '.03em' }}>#</th>
                <th style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary, #888)', padding: '8px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', letterSpacing: '.03em' }}>Type</th>
                <th style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary, #888)', padding: '8px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', letterSpacing: '.03em' }}>Line</th>
                <th style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary, #888)', padding: '8px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', letterSpacing: '.03em' }}>Change</th>
                <th onClick={toggleSort} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary, #888)', padding: '8px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', letterSpacing: '.03em' }}>Score ↕</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const isOpen = openRow === m.id;
                const typeColor = TYPE_COLORS[m.type] || { bg: 'rgba(100,100,100,.1)', color: 'var(--text-secondary, #bbb)' };
                
                return (
                  <React.Fragment key={m.id || i}>
                    <tr 
                      onClick={() => setOpenRow(isOpen ? null : m.id)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background .1s',
                        background: isOpen ? 'rgba(212,82,42,.05)' : 'transparent'
                      }}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface-2, #1e1e1e)'; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', verticalAlign: 'top', fontSize: '12px', color: 'var(--text-tertiary, #888)', fontFamily: 'var(--font-mono, monospace)' }}>
                        {i + 1}
                      </td>
                      <td style={{ width: '160px', padding: '9px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', verticalAlign: 'top' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', padding: '2px 7px', borderRadius: '4px', fontWeight: 500, background: typeColor.bg, color: typeColor.color }}>
                          {m.type}
                        </span>
                      </td>
                      <td style={{ width: '50px', padding: '9px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', verticalAlign: 'top', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-secondary, #bbb)' }}>
                        L{m.line}
                      </td>
                      <td style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', verticalAlign: 'top' }}>
                        {renderChange(m)}
                      </td>
                      <td style={{ width: '90px', padding: '9px 12px', borderBottom: '0.5px solid var(--surface-3, #333)', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', justifyContent: 'flex-end' }}>
                          <span style={{ color: scoreColor(m.score), fontWeight: 500 }}>{m.score}/10</span>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: scoreColor(m.score) }}></div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ padding: 0, borderBottom: '0.5px solid var(--surface-3, #333)', borderBottomWidth: isOpen ? '0.5px' : '0' }}>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '12px 14px 14px 52px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'transparent' }}>
                                <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '8px', padding: '9px 11px', border: '0.5px solid var(--surface-3, #333)' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary, #888)', marginBottom: '3px', letterSpacing: '.04em' }}>Before</div>
                                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #fff)' }}>{m.before}</div>
                                </div>
                                <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '8px', padding: '9px 11px', border: '0.5px solid var(--surface-3, #333)' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary, #888)', marginBottom: '3px', letterSpacing: '.04em' }}>After</div>
                                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: '#c94c24', fontWeight: 500 }}>{m.after}</div>
                                </div>
                                <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '8px', padding: '9px 11px', border: '0.5px solid var(--surface-3, #333)' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary, #888)', marginBottom: '3px', letterSpacing: '.04em' }}>Pass</div>
                                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #fff)' }}>pass {m.pass || 1}</div>
                                </div>
                                <div style={{ background: 'var(--surface-2, #1e1e1e)', borderRadius: '8px', padding: '9px 11px', border: '0.5px solid var(--surface-3, #333)' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary, #888)', marginBottom: '3px', letterSpacing: '.04em' }}>Safe mode</div>
                                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: m.safe ? '#1a8a5a' : '#b83232' }}>{m.safe ? 'allowed' : 'blocked'}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', fontSize: '12px', lineHeight: 1.6, padding: '9px 11px', borderLeft: '2px solid #d4522a', background: 'rgba(212,82,42,.05)', color: 'var(--text-secondary, #bbb)' }}>
                                  {m.description || 'No description provided.'}
                                </div>
                                {TYPE_HINTS[m.type] && (
                                  <div style={{ gridColumn: '1 / -1', fontSize: '12px', lineHeight: 1.6, padding: '9px 11px', borderLeft: '2px solid rgba(100,100,100,.3)', background: 'var(--surface-2, #1e1e1e)', color: 'var(--text-tertiary, #888)' }}>
                                    {TYPE_HINTS[m.type]}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* SECTION 4 — TABLE FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: '11px', color: 'var(--text-tertiary, #888)', borderTop: '0.5px solid var(--surface-3, #333)', background: 'var(--surface-1, #111)' }}>
          <span>{filtered.length} mutations · {new Set(filtered.map(m => m.type)).size} unique types</span>
          <span style={{ cursor: 'pointer', color: 'var(--text-tertiary, #888)' }} onClick={() => console.log('What is chaos score?')}>What is chaos score? ↗</span>
        </div>
      </div>
    </div>
  );
}