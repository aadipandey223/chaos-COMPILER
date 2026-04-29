const express = require('express');
const { runBridge } = require('../utils/pythonLearnerBridge');
const { toParseTreeGraph } = require('../contracts/learnerContracts');

const router = express.Router();

router.post('/process', (req, res) => {
  try {
    const source = String(req.body?.source ?? req.body?.code ?? '');
    const result = runBridge({ action: 'pipeline', source });
    return res.json({
      ok: true,
      tokens: result.tokens || [],
      parse_steps: result.parse_steps || [],
      parse_tree: result.parse_tree || null,
      parse_tree_graph: toParseTreeGraph(result.parse_tree || null),
      semantic: result.semantic || null,
      intermediate_code: result.intermediate_code || [],
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
