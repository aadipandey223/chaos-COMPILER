const { execFile } = require('child_process');
const path = require('path');

const COMPILER_BIN = path.resolve(
  __dirname,
  '../../compiler',
  process.platform === 'win32' ? 'chaos-compiler.exe' : 'chaos-compiler'
);

function runCompiler(filePath, options = {}) {
  const args = [filePath, '--json'];

  if (options.mutate !== false) {
    args.push('--mutate');
    args.push('--intensity', options.intensity || 'low');
    if (options.seed) args.push('--seed', String(options.seed));
  }

  return new Promise((resolve, reject) => {
    execFile(COMPILER_BIN, args, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          return reject(new Error('Compiler timed out after 10 seconds'));
        }
        return reject(new Error(stderr || stdout || error.message));
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve({
          ast:       result.ast       || result,
          mutations: result.mutations || [],
          stderr:    stderr || null,
        });
      } catch (e) {
        reject(new Error(`Failed to parse compiler output:\n${stdout}`));
      }
    });
  });
}

module.exports = { runCompiler };
