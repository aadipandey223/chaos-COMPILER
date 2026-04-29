const AUTOMATA_SYMBOL_EPSILON = 'ε';

function normalizeState(raw, fallbackId) {
  return {
    id: typeof raw?.id === 'number' ? raw.id : Number(fallbackId),
    isStart: Boolean(raw?.isStart),
    isFinal: Boolean(raw?.isFinal ?? raw?.isAccept),
  };
}

function normalizeTransition(raw) {
  return {
    from: Number(raw?.from),
    to: Number(raw?.to),
    symbol: String(raw?.symbol ?? raw?.label ?? ''),
  };
}

function normalizeAutomaton(raw) {
  return {
    states: (raw?.states || []).map((s, idx) => normalizeState(s, idx)),
    transitions: (raw?.transitions || []).map(normalizeTransition),
  };
}

function validateAutomatonShape(automaton, mode = 'NFA') {
  const errors = [];
  const normalizedMode = String(mode || 'NFA').toUpperCase();
  const states = automaton?.states || [];
  const transitions = automaton?.transitions || [];

  if (!states.length) errors.push('Automaton must contain at least one state.');
  const startCount = states.filter((s) => s.isStart).length;
  if (startCount !== 1) errors.push('Automaton must have exactly one start state.');

  const stateIds = new Set(states.map((s) => s.id));
  for (const t of transitions) {
    if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
      errors.push(`Transition ${t.from} -> ${t.to} references undefined states.`);
    }
    if (!t.symbol) errors.push(`Transition ${t.from} -> ${t.to} has an empty symbol.`);
    if (normalizedMode === 'DFA' && t.symbol === AUTOMATA_SYMBOL_EPSILON) {
      errors.push('DFA mode does not allow epsilon transitions.');
    }
  }

  if (normalizedMode === 'DFA') {
    const seen = new Set();
    for (const t of transitions) {
      const key = `${t.from}:${t.symbol}`;
      if (seen.has(key)) {
        errors.push(`DFA must not have multiple outgoing transitions for symbol "${t.symbol}" from state ${t.from}.`);
      }
      seen.add(key);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function toParseTreeGraph(parseTree) {
  const nodes = [];
  const edges = [];
  let nextId = 1;

  function walk(node, parentId = null) {
    if (!node) return null;
    const id = String(nextId++);
    nodes.push({ id, label: String(node.value ?? '?') });
    if (parentId) edges.push({ source: parentId, target: id });
    for (const child of node.children || []) walk(child, id);
    return id;
  }

  walk(parseTree, null);
  return { nodes, edges };
}

function normalizeGrammarResponse(raw) {
  const issues = raw?.issues || [];
  return {
    rules: raw?.rules || [],
    issues,
    isValid: issues.length === 0,
    errors: issues.map((issue) => issue.message),
  };
}

module.exports = {
  AUTOMATA_SYMBOL_EPSILON,
  normalizeAutomaton,
  validateAutomatonShape,
  toParseTreeGraph,
  normalizeGrammarResponse,
};
