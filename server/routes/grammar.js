const express = require('express');
const { runBridge } = require('../utils/pythonLearnerBridge');
const { normalizeGrammarResponse } = require('../contracts/learnerContracts');

const router = express.Router();

router.post('/check', (req, res) => {
  try {
    const grammar = String(req.body?.grammar || '');
    const raw = runBridge({ action: 'grammar', grammar });
    return res.json(normalizeGrammarResponse(raw));
  } catch (error) {
    return res.status(500).json({
      rules: [],
      issues: [{ type: 'error', rule: '*', message: error.message }],
      isValid: false,
      errors: [error.message],
    });
  }
});

module.exports = router;
