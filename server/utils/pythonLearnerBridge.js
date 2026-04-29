const path = require('path');
const { spawnSync } = require('child_process');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'backend', 'bridge.py');

function runBridge(payload) {
  const python = process.env.PYTHON || 'python';
  const result = spawnSync(python, [BRIDGE_PATH], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    cwd: path.join(__dirname, '..', '..', 'backend'),
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Python bridge failed.');
  }
  return JSON.parse(result.stdout || '{}');
}

module.exports = {
  runBridge,
};
