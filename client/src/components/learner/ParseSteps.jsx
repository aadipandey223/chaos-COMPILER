import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_STYLE = {
  shift:  { color: '#60a5fa' },
  reduce: { color: '#fb923c' },
  accept: { color: '#4ade80' },
  error:  { color: '#f87171' },
};

export default function ParseSteps({ parseSteps = [] }) {
  const [cursor, setCursor] = useState(0);

  if (!parseSteps.length) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-tertiary)' }}>
        <div style={{ fontSize:40, opacity:0.25 }}>⊢</div>
        <p style={{ fontSize:13 }}>No parse steps yet — press <strong style={{color:'var(--accent)'}}>Start Process</strong></p>
      </div>
    );
  }

  const step = parseSteps[Math.min(cursor, parseSteps.length - 1)];
  const word = (step?.action || '').split(' ')[0].toLowerCase();
  const acStyle = ACTION_STYLE[word] || {};

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:14 }}>
      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'var(--surface-0)', borderRadius:10, border:'1px solid var(--border)', flexShrink:0 }}>
        <button disabled={cursor===0} onClick={() => setCursor(c=>c-1)}
          style={{ padding:'6px 10px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, cursor:cursor===0?'not-allowed':'pointer', opacity:cursor===0?0.35:1 }}>
          <ChevronLeft size={16} color="var(--text-primary)" />
        </button>
        <span style={{ fontFamily:'var(--font-code)', fontSize:13, color:'var(--text-secondary)' }}>
          Step <strong style={{color:'var(--text-primary)'}}>{cursor+1}</strong> / {parseSteps.length}
        </span>
        <button disabled={cursor===parseSteps.length-1} onClick={() => setCursor(c=>c+1)}
          style={{ padding:'6px 10px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, cursor:cursor===parseSteps.length-1?'not-allowed':'pointer', opacity:cursor===parseSteps.length-1?0.35:1 }}>
          <ChevronRight size={16} color="var(--text-primary)" />
        </button>
      </div>

      {/* Current step highlight */}
      <div style={{ padding:'14px 18px', background:'var(--surface-0)', borderRadius:10, border:'1px solid var(--border)', flexShrink:0 }}>
        <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:10 }}>Current Step</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, fontFamily:'var(--font-code)', fontSize:12 }}>
          {[['Stack', step?.stack], ['Input', step?.input], ['Action', step?.action]].map(([label, val]) => (
            <div key={label}>
              <p style={{ color:'var(--text-tertiary)', fontSize:10, marginBottom:4 }}>{label}</p>
              <p style={{ background:'var(--surface-2)', borderRadius:6, padding:'6px 10px', color: label==='Action' ? (acStyle.color||'var(--text-primary)') : 'var(--text-primary)', fontWeight: label==='Action' ? 700 : 400, wordBreak:'break-all' }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div style={{ flex:1, overflow:'auto', borderRadius:8, border:'1px solid var(--border)' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:12 }}>
          <thead>
            <tr>
              {['#','Stack','Input','Action'].map(h => (
                <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'var(--text-tertiary)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', background:'var(--surface-0)', borderBottom:'1px solid var(--border)', position:'sticky', top:0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parseSteps.map((s, i) => {
              const w = (s?.action||'').split(' ')[0].toLowerCase();
              const asc = ACTION_STYLE[w] || {};
              const isActive = i === cursor;
              return (
                <tr key={i} onClick={() => setCursor(i)}
                  style={{ cursor:'pointer', background: isActive ? 'var(--accent-subtle)' : 'transparent', transition:'background 0.1s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding:'8px 14px', color:'var(--text-tertiary)', fontFamily:'var(--font-code)', borderBottom:'1px solid var(--border)', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent' }}>{i+1}</td>
                  <td style={{ padding:'8px 14px', fontFamily:'var(--font-code)', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{s?.stack}</td>
                  <td style={{ padding:'8px 14px', fontFamily:'var(--font-code)', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{s?.input}</td>
                  <td style={{ padding:'8px 14px', fontFamily:'var(--font-code)', fontWeight:700, color: asc.color||'var(--text-primary)', borderBottom:'1px solid var(--border)' }}>{s?.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
