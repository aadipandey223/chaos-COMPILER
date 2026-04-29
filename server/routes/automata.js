const express = require('express');
const { runAutomataEngine } = require('../utils/automataEngine');
const { normalizeAutomaton, validateAutomatonShape } = require('../contracts/learnerContracts');

const router = express.Router();

function toLegacyGraph(automaton, trace = []) {
  const traceStateSet = new Set(trace.flat());
  const traceStepEdges = [];
  for (let i = 1; i < trace.length; i++) {
    for (const from of trace[i - 1]) {
      for (const to of trace[i]) {
        traceStepEdges.push(`${from}-${to}`);
      }
    }
  }
  const traceEdgeSet = new Set(traceStepEdges);
  return {
    states: (automaton.states || []).map((s) => ({
      id: `q${s.id}`,
      label: `q${s.id}`,
      isStart: Boolean(s.isStart),
      isAccept: Boolean(s.isFinal),
    })),
    transitions: (automaton.transitions || []).map((t, idx) => ({
      id: `${t.from}-${t.to}-${t.symbol}-${idx}`,
      from: `q${t.from}`,
      to: `q${t.to}`,
      label: t.symbol,
    })),
    traceStates: [...traceStateSet].map((id) => `q${id}`),
    traceEdges: [...traceEdgeSet].map((edge) => {
      const [from, to] = edge.split('-');
      return `${from}-${to}`;
    }),
  };
}

router.post('/simulate', (req, res) => {
  try {
    const { automaton: rawAutomaton, input = '', mode = 'NFA' } = req.body || {};
    const automaton = normalizeAutomaton(rawAutomaton);
    const validity = validateAutomatonShape(automaton, mode);
    if (!validity.ok) return res.status(400).json({ ok: false, errors: validity.errors });

    const result = runAutomataEngine({
      action: 'simulate',
      mode: String(mode || 'NFA').toUpperCase(),
      input: String(input || ''),
      automaton,
    });

    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/convert', (req, res) => {
  try {
    const { automaton: rawAutomaton } = req.body || {};
    const automaton = normalizeAutomaton(rawAutomaton);
    const validity = validateAutomatonShape(automaton, 'NFA');
    if (!validity.ok) return res.status(400).json({ ok: false, errors: validity.errors });

    const result = runAutomataEngine({
      action: 'convert',
      mode: 'NFA',
      automaton,
    });

    return res.json({ ok: true, dfa: result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/trace', (req, res) => {
  try {
    const { tokenType, tokenValue } = req.body || {};
    if (!tokenValue || typeof tokenValue !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing tokenValue' });
    }

    const type = String(tokenType || '').toUpperCase();
    const chars = Array.from(tokenValue);
    const nfa = {
      states: chars.map((_, idx) => ({ id: idx, isStart: idx === 0, isFinal: false })).concat({
        id: chars.length,
        isStart: false,
        isFinal: true,
      }),
      transitions: chars.map((ch, idx) => ({ from: idx, to: idx + 1, symbol: ch })),
    };
    const dfaResult = runAutomataEngine({ action: 'convert', mode: 'NFA', automaton: nfa });
    const traceResult = runAutomataEngine({ action: 'simulate', mode: 'DFA', input: tokenValue, automaton: dfaResult });

    return res.json({
      ok: true,
      type: type || 'UNKNOWN',
      token: tokenValue,
      nfa: toLegacyGraph(nfa, []),
      dfa: toLegacyGraph(traceResult, traceResult.trace || []),
      trace: traceResult.trace || [],
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
