const API_URL = '/api';

export const compileCode = async (code) => {
  const response = await fetch(`${API_URL}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    throw new Error('Compilation failed');
  }
  
  return response.json();
};

export const runLearnerPipeline = async (source) => {
  const response = await fetch(`${API_URL}/learner/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  if (!response.ok) throw new Error('Learner processing failed');
  return response.json();
};

export const simulateAutomata = async ({ mode, input, automaton }) => {
  const response = await fetch(`${API_URL}/automata/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, input, automaton }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || (payload?.errors || []).join(', ') || 'Automata simulation failed');
  return payload;
};
