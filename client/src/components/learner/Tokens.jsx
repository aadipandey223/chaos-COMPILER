import React from 'react';

const TYPE_COLORS = {
  KEYWORD:    { bg: '#1e3a5f', text: '#7dd3fc', border: '#0369a1' },
  IDENTIFIER: { bg: '#14532d', text: '#86efac', border: '#15803d' },
  NUMBER:     { bg: '#3b1f6e', text: '#d8b4fe', border: '#7c3aed' },
  OPERATOR:   { bg: '#7c2d12', text: '#fb923c', border: '#c2410c' },
  PUNCTUATION:{ bg: '#1e293b', text: '#94a3b8', border: '#374151' },
  ERROR:      { bg: '#450a0a', text: '#fca5a5', border: '#dc2626' },
};

const Badge = ({ type }) => {
  const s = TYPE_COLORS[type] || TYPE_COLORS.PUNCTUATION;
  return (
    <span style={{
      display:      'inline-block',
      padding:      '2px 8px',
      borderRadius: 4,
      fontSize:     11,
      fontWeight:   700,
      fontFamily:   'var(--font-code)',
      textTransform:'uppercase',
      letterSpacing:'0.05em',
      background:   s.bg,
      color:        s.text,
      border:       `1px solid ${s.border}`,
    }}>
      {type}
    </span>
  );
};

export default function Tokens({ tokens = [], onSelect, selectedIndex = null }) {
  if (!tokens.length) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-tertiary)' }}>
        <div style={{ fontSize: 40, opacity: 0.25, fontFamily:'var(--font-code)' }}>[ ]</div>
        <p style={{ fontSize:13 }}>No tokens yet — press <strong style={{color:'var(--accent)'}}>Start Process</strong></p>
      </div>
    );
  }

  return (
    <div style={{ overflow:'auto', height:'100%', borderRadius:8 }}>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:13 }}>
        <thead>
          <tr style={{ position:'sticky', top:0, zIndex:10 }}>
            {['#','Type','Value','Line'].map(h => (
              <th key={h} style={{
                padding:     '10px 16px',
                textAlign:   'left',
                color:       'var(--text-tertiary)',
                fontWeight:  700,
                fontSize:    11,
                textTransform:'uppercase',
                letterSpacing:'0.1em',
                background:  'var(--surface-0)',
                borderBottom:'1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((tok, i) => {
            const isSelected = selectedIndex === i;
            return (
            <tr key={i}
              style={{ transition:'background 0.1s', background: isSelected ? 'var(--accent-subtle)' : 'transparent', cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect && onSelect(tok, i)}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding:'10px 16px', color:'var(--text-tertiary)', fontFamily:'var(--font-code)', fontSize:11, borderBottom:'1px solid var(--border)' }}>{i+1}</td>
              <td style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}><Badge type={tok.type} /></td>
              <td style={{ padding:'10px 16px', fontFamily:'var(--font-code)', color:'var(--text-primary)', borderBottom:'1px solid var(--border)' }}>{tok.value}</td>
              <td style={{ padding:'10px 16px', fontFamily:'var(--font-code)', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{tok.line}</td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
