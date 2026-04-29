const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeAutomaton,
  validateAutomatonShape,
  toParseTreeGraph,
  normalizeGrammarResponse,
} = require('../contracts/learnerContracts');

test('normalizeAutomaton maps accept flag into isFinal', () => {
  const automaton = normalizeAutomaton({
    states: [{ id: 0, isStart: true, isAccept: true }],
    transitions: [{ from: 0, to: 0, label: 'a' }],
  });
  assert.equal(automaton.states[0].isFinal, true);
  assert.equal(automaton.transitions[0].symbol, 'a');
});

test('validateAutomatonShape rejects DFA epsilon transitions', () => {
  const validity = validateAutomatonShape(
    {
      states: [{ id: 0, isStart: true, isFinal: false }],
      transitions: [{ from: 0, to: 0, symbol: 'ε' }],
    },
    'DFA'
  );
  assert.equal(validity.ok, false);
});

test('toParseTreeGraph builds node and edge lists', () => {
  const graph = toParseTreeGraph({
    value: 'E',
    children: [{ value: 'id', children: [] }],
  });
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
});

test('normalizeGrammarResponse reports isValid', () => {
  assert.equal(normalizeGrammarResponse({ rules: [], issues: [] }).isValid, true);
  assert.equal(
    normalizeGrammarResponse({
      rules: [],
      issues: [{ message: 'bad grammar' }],
    }).isValid,
    false
  );
});
