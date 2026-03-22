const express = require('express');
const multer  = require('multer');
const fs      = require('fs').promises;
const path    = require('path');
const os      = require('os');
const { runCompiler } = require('../utils/runner');

const router = express.Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 1024 * 1024 }, // 1 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.c' && ext !== '.cpp') {
      return cb(new Error('Only .c and .cpp files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/compile', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: 'File size limit exceeded: 1MB', type: 'compiler_error' });
      }
      return res.status(400).json({ ok: false, error: err.message, type: 'compiler_error' });
    } else if (err) {
      return res.status(400).json({ ok: false, error: err.message, type: 'compiler_error' });
    }
    next();
  });
}, async (req, res) => {
  let tempFilePath = null;

  try {
    if (req.file) {
      tempFilePath = req.file.path;
    } else if (req.body && req.body.code) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      tempFilePath = path.join(os.tmpdir(), `chaos-code-${uniqueSuffix}.c`);
      await fs.writeFile(tempFilePath, req.body.code);
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Provide either a file upload or JSON body with code.',
        type: 'compiler_error'
      });
    }

    let result;
    try {
      result = await runCompiler(tempFilePath, {
        mutate:           req.body.mutate !== false,
        count:            req.body.count            || null,
        intensity:        req.body.intensity        || 'low',
        seed:             req.body.seed             || null,
        safeMode:         req.body.safeMode         || false,
        excludeFunctions: req.body.excludeFunctions || [],
        excludeLines:     req.body.excludeLines     || [],
        chainDepth:       req.body.chainDepth       || 1,
        targetMask:       req.body.targetMask       || 0,
      });
    } catch (compilerError) {
      return res.status(400).json({
        ok:    false,
        error: compilerError.message,
        type:  'compiler_error'
      });
    }

    return res.json({
      ok:        true,
      ast:       result.ast,
      mutations: result.mutations,
      warnings:  result.stderr || null,
    });

  } catch (err) {
    return res.status(500).json({
      ok:    false,
      error: 'Internal server error: ' + err.message,
      type:  'server_error'
    });
  } finally {
    if (tempFilePath) {
      try { await fs.unlink(tempFilePath); } catch (_) {}
    }
  }
});

module.exports = router;
