const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runFallback } = require('./automataFallback');

const ENGINE_DIR = path.join(__dirname, '..', 'native', 'automata');
const ENGINE_SRC = path.join(ENGINE_DIR, 'engine.cpp');
const ENGINE_BIN = path.join(ENGINE_DIR, process.platform === 'win32' ? 'engine.exe' : 'engine');

function compileEngineIfNeeded() {
  if (fs.existsSync(ENGINE_BIN)) return;
  const compiler = process.env.CXX || 'g++';
  const result = spawnSync(compiler, ['-std=c++17', ENGINE_SRC, '-O2', '-o', ENGINE_BIN], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Failed to build C++ automata engine: ${result.stderr || result.stdout || 'unknown error'}`);
  }
}

function runAutomataEngine(payload) {
  try {
    compileEngineIfNeeded();
    const result = spawnSync(ENGINE_BIN, [], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || 'Automata engine execution failed.');
    }

    let parsed;
    try {
      parsed = JSON.parse(result.stdout || '{}');
    } catch (error) {
      throw new Error(`Automata engine returned invalid JSON: ${error.message}`);
    }
    if (parsed.error) throw new Error(parsed.error);
    return parsed;
  } catch (_) {
    return runFallback(payload);
  }
}

module.exports = {
  runAutomataEngine,
};
