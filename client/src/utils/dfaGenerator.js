export async function generateDFA(code) {
  const res = await fetch('/api/dfa/extract', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('DFA generation failed');
  return res.json();
}