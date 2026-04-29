const test = require('node:test');
const assert = require('node:assert/strict');
const { runAutomataEngine } = require('../utils/automataEngine');

test('subset construction returns deterministic automaton', () => {
  const nfa = {
    states: [
      { id: 0, isStart: true, isFinal: false },
      { id: 1, isStart: false, isFinal: true },
    ],
    transitions: [
      { from: 0, to: 1, symbol: 'a' },
      { from: 1, to: 1, symbol: 'a' },
    ],
  };
  const result = runAutomataEngine({ action: 'convert', mode: 'NFA', automaton: nfa });
  assert.ok(Array.isArray(result.states));
  assert.ok(Array.isArray(result.transitions));
});

test('tracePath returns per-step active states', () => {
  const dfa = {
    states: [
      { id: 0, isStart: true, isFinal: false },
      { id: 1, isStart: false, isFinal: true },
    ],
    transitions: [{ from: 0, to: 1, symbol: 'a' }],
  };
  const result = runAutomataEngine({ action: 'simulate', mode: 'DFA', input: 'a', automaton: dfa });
  assert.deepEqual(result.trace[0], [0]);
  assert.deepEqual(result.trace[1], [1]);
});
