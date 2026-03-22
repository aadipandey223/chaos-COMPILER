export function validateDFA(userGraph, autoGraph) {
  const result = {
    score:        0,
    correct:      [],
    missing:      [],
    wrong:        [],
    extra:        [],
    missingNodes: [],
    feedback:     [],
  };

  if (!autoGraph.edges.length) return result;

  for (const autoNode of autoGraph.nodes) {
    const found = userGraph.nodes.find(
      n => n.label.trim().toLowerCase() === autoNode.label.trim().toLowerCase()
    );
    if (!found) {
      result.missingNodes.push(autoNode.label);
      result.feedback.push(`Missing state: "${autoNode.label}"`);
    }
  }

  for (const autoEdge of autoGraph.edges) {
    const autoFrom = autoGraph.nodes.find(n => n.id === autoEdge.from)?.label || autoEdge.from;
    const autoTo = autoGraph.nodes.find(n => n.id === autoEdge.to)?.label || autoEdge.to;

    const userFromNode = userGraph.nodes.find(n => n.label.trim().toLowerCase() === autoFrom.toLowerCase());
    const userToNode = userGraph.nodes.find(n => n.label.trim().toLowerCase() === autoTo.toLowerCase());

    if (!userFromNode || !userToNode) {
      result.missing.push({ from: autoFrom, to: autoTo, label: autoEdge.label });
      result.feedback.push(`Missing transition: ${autoFrom} → ${autoTo} on "${autoEdge.label}"`);
      continue;
    }

    const userEdge = userGraph.edges.find(e => e.from === userFromNode.id && e.to === userToNode.id);

    if (!userEdge) {
      result.missing.push({ from: autoFrom, to: autoTo, label: autoEdge.label });
      result.feedback.push(`Missing transition: ${autoFrom} → ${autoTo} on "${autoEdge.label}"`);
    } else if (userEdge.label.trim().toLowerCase() !== autoEdge.label.trim().toLowerCase()) {
      result.wrong.push({ edgeId: userEdge.id, expected: autoEdge.label, actual: userEdge.label });
      result.feedback.push(`Wrong label on ${autoFrom} → ${autoTo}: you wrote "${userEdge.label}", expected "${autoEdge.label}"`);
    } else {
      result.correct.push(userEdge.id);
    }
  }

  for (const userEdge of userGraph.edges) {
    const isCorrect = result.correct.includes(userEdge.id);
    const isWrong   = result.wrong.some(w => w.edgeId === userEdge.id);
    if (!isCorrect && !isWrong) {
      result.extra.push(userEdge.id);
      const fromLabel = userGraph.nodes.find(n => n.id === userEdge.from)?.label || '?';
      const toLabel = userGraph.nodes.find(n => n.id === userEdge.to)?.label || '?';
      result.feedback.push(`Extra transition: ${fromLabel} → ${toLabel} on "${userEdge.label}" (not in auto DFA)`);
    }
  }

  const totalExpected = autoGraph.edges.length;
  const correctCount  = result.correct.length;
  result.score = totalExpected > 0 ? Math.round((correctCount / totalExpected) * 100) : 0;

  return result;
}