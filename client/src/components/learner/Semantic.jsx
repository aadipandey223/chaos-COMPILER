import React, { useState } from 'react';
import { AlertCircle, ArrowUpDown } from 'lucide-react';

export default function Semantic({ semantic }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState(1);

  const { symbol_table = {}, errors = [] } = semantic || {};
  const symbols = Object.entries(symbol_table).map(([name, info]) => ({ name, ...info }));

  if (!semantic) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-tertiary)' }}>
        <div style={{ fontSize:40, opacity:0.25 }}>Σ</div>
        <p style={{ fontSize:13 }}>No semantic data yet — press <strong style={{color:'var(--accent)'}}>Start Process</strong></p>
      </div>
    );
  }

  const sorted = [...symbols].sort((a, b) => {
    const va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
    return va < vb ? -sortDir : va > vb ? sortDir : 0;
  });

  const toggleSort = (k) => { if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(1); } };

  const SortTh = ({ k, label }) => (
    <th style={{ padding:'9px 16px', textAlign:'left', fontSize:10, color:'var(--text-tertiary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'var(--surface-0)', borderBottom:'1px solid var(--border)', cursor:'pointer', position:'sticky', top:0 }}
      onClick={() => toggleSort(k)}>
      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
        {label} <ArrowUpDown size={11} color={sortKey===k ? 'var(--accent)' : 'var(--text-tertiary)'} />
      </span>
    </th>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:16 }}>
      <div style={{ flex:1, overflow:'auto', minHeight:0, borderRadius:8, border:'1px solid var(--border)' }}>
        <p style={{ padding:'10px 16px 0', fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Symbol Table</p>
        {sorted.length === 0
          ? <p style={{ padding:'16px', fontSize:13, color:'var(--text-tertiary)' }}>No symbols found.</p>
          : (
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:13, marginTop:8 }}>
              <thead><tr><SortTh k="name" label="Name" /><SortTh k="type" label="Type" /><SortTh k="scope" label="Scope" /><SortTh k="line" label="Line" /></tr></thead>
              <tbody>
                {sorted.map((sym, i) => (
                  <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} style={{transition:'background 0.1s'}}>
                    <td style={{ padding:'9px 16px', fontFamily:'var(--font-code)', color:'var(--text-primary)', borderBottom:'1px solid var(--border)' }}>{sym.name}</td>
                    <td style={{ padding:'9px 16px', fontFamily:'var(--font-code)', color:'var(--info)', borderBottom:'1px solid var(--border)' }}>{sym.type}</td>
                    <td style={{ padding:'9px 16px', fontFamily:'var(--font-code)', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{sym.scope}</td>
                    <td style={{ padding:'9px 16px', fontFamily:'var(--font-code)', color:'var(--text-tertiary)', borderBottom:'1px solid var(--border)' }}>{sym.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {errors.length > 0 && (
        <div style={{ flexShrink:0 }}>
          <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            <AlertCircle size={13} color="var(--error)" /> Semantic Errors
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:180, overflowY:'auto' }}>
            {errors.map((err, i) => (
              <div key={i} style={{ padding:'10px 14px', borderRadius:8, border:'1px solid var(--error-light)', background:'var(--error-light)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--error)' }}>{err.type?.replace('_',' ')}</span>
                  <span style={{ fontSize:11, fontFamily:'var(--font-code)', color:'var(--text-tertiary)' }}>Line {err.line}</span>
                </div>
                <p style={{ fontSize:12, color:'var(--text-secondary)' }}>{err.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
