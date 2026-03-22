const CANONICAL_STATES = [
  { id: 'START',  label: 'Start',  isStart: true,  isAccept: false, x: 100, y: 200 },
  { id: 'IDENT',  label: 'Ident',  isStart: false, isAccept: true,  x: 300, y: 100 },
  { id: 'NUMBER', label: 'Number', isStart: false, isAccept: true,  x: 300, y: 300 },
  { id: 'OP',     label: 'Op',     isStart: false, isAccept: true,  x: 500, y: 200 },
  { id: 'ACCEPT', label: 'Accept', isStart: false, isAccept: true,  x: 700, y: 200 },
];

const CANONICAL_TRANSITIONS = [
  { id: 't1', from: 'START', to: 'IDENT',  label: 'a-z A-Z _'  },
  { id: 't2', from: 'START', to: 'NUMBER', label: '0-9'         },
  { id: 't3', from: 'START', to: 'OP',     label: '+ - * / < >' },
  { id: 't4', from: 'IDENT', to: 'IDENT',  label: 'a-z 0-9 _'  },
  { id: 't5', from: 'IDENT', to: 'ACCEPT', label: 'other'       },
  { id: 't6', from: 'NUMBER',to: 'NUMBER', label: '0-9'         },
  { id: 't7', from: 'NUMBER',to: 'ACCEPT', label: 'other'       },
  { id: 't8', from: 'OP',    to: 'OP',     label: '= >'         },
  { id: 't9', from: 'OP',    to: 'ACCEPT', label: 'other'       },
];

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'No code' });

  const hasIdent  = /\\b[a-zA-Z_]\\w*\\b/.test(code);
  const hasNumber = /\\b\\d+\\b/.test(code);
  const hasOp     = /[+\\-*\\/<>=!&|]/.test(code);

  const relevantStates = new Set(['START', 'ACCEPT']);
  if (hasIdent)  relevantStates.add('IDENT');
  if (hasNumber) relevantStates.add('NUMBER');
  if (hasOp)     relevantStates.add('OP');

  const states = CANONICAL_STATES.filter(s => relevantStates.has(s.id));
  const transitions = CANONICAL_TRANSITIONS.filter(
    t => relevantStates.has(t.from) && relevantStates.has(t.to)
  );

  return res.status(200).json({
    ok:            true,
    states,
    transitions,
    relevantTypes: [...relevantStates],
    totalStates:   states.length,
    totalEdges:    transitions.length,
  });
};
