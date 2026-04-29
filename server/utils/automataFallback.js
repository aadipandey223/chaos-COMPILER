function getStartStateId(automaton) {
  const start = automaton.states.find((s) => s.isStart);
  return start ? start.id : automaton.states[0]?.id ?? 0;
}

function epsilonClosure(automaton, states) {
  const closure = new Set(states);
  const queue = [...states];
  while (queue.length) {
    const current = queue.shift();
    for (const t of automaton.transitions) {
      if (t.from === current && t.symbol === 'ε' && !closure.has(t.to)) {
        closure.add(t.to);
        queue.push(t.to);
      }
    }
  }
  return closure;
}

function move(automaton, states, symbol) {
  const moved = new Set();
  for (const state of states) {
    for (const t of automaton.transitions) {
      if (t.from === state && t.symbol === symbol) moved.add(t.to);
    }
  }
  return moved;
}

function convertToDFA(nfa) {
  const symbols = [...new Set(nfa.transitions.map((t) => t.symbol).filter((s) => s !== 'ε'))];
  const subsetToId = new Map();
  const work = [];
  const dfa = { states: [], transitions: [] };

  const startSet = epsilonClosure(nfa, new Set([getStartStateId(nfa)]));
  const startKey = [...startSet].sort((a, b) => a - b).join(',');
  subsetToId.set(startKey, 0);
  work.push(startSet);
  dfa.states.push({
    id: 0,
    isStart: true,
    isFinal: [...startSet].some((id) => nfa.states.find((s) => s.id === id)?.isFinal),
  });

  while (work.length) {
    const current = work.shift();
    const fromId = subsetToId.get([...current].sort((a, b) => a - b).join(','));
    for (const symbol of symbols) {
      const moved = move(nfa, current, symbol);
      if (!moved.size) continue;
      const next = epsilonClosure(nfa, moved);
      const key = [...next].sort((a, b) => a - b).join(',');
      if (!subsetToId.has(key)) {
        const id = subsetToId.size;
        subsetToId.set(key, id);
        work.push(next);
        dfa.states.push({
          id,
          isStart: false,
          isFinal: [...next].some((sid) => nfa.states.find((s) => s.id === sid)?.isFinal),
        });
      }
      dfa.transitions.push({ from: fromId, to: subsetToId.get(key), symbol });
    }
  }
  return dfa;
}

function tracePath(automaton, input, mode) {
  if (mode === 'DFA') {
    const trace = [[getStartStateId(automaton)]];
    let current = getStartStateId(automaton);
    for (const ch of input) {
      const next = automaton.transitions.find((t) => t.from === current && t.symbol === ch);
      if (!next) {
        trace.push([]);
        break;
      }
      current = next.to;
      trace.push([current]);
    }
    return trace;
  }

  const trace = [];
  let active = epsilonClosure(automaton, new Set([getStartStateId(automaton)]));
  trace.push([...active].sort((a, b) => a - b));
  for (const ch of input) {
    active = epsilonClosure(automaton, move(automaton, active, ch));
    trace.push([...active].sort((a, b) => a - b));
  }
  return trace;
}

function runFallback(payload) {
  const mode = String(payload.mode || 'NFA').toUpperCase();
  if (payload.action === 'convert') return convertToDFA(payload.automaton);
  return {
    ...payload.automaton,
    trace: tracePath(payload.automaton, String(payload.input || ''), mode),
  };
}

module.exports = { runFallback };
