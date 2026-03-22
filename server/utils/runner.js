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

    // --count takes priority over --intensity
    if (options.count && Number.isInteger(Number(options.count))) {
      args.push('--count', String(options.count));
    } else {
      args.push('--intensity', options.intensity || 'low');
    }

    if (options.seed) args.push('--seed', String(options.seed));
    if (options.safeMode) args.push('--safe');

    // Batch 2: per-type weights config file
    if (options.weightsFile) {
      args.push('--weights', options.weightsFile);
    }

    // Batch 2: excluded functions
    if (options.excludeFunctions && options.excludeFunctions.length > 0) {
      args.push('--exclude-fns', options.excludeFunctions.join(','));
    }

    // Batch 2: excluded line ranges  e.g. "1-5,10-12"
    if (options.excludeLines && options.excludeLines.length > 0) {
      args.push('--exclude-lines', options.excludeLines.join(','));
    }

    // Batch 2: mutation chain depth
    if (options.chainDepth && options.chainDepth > 1) {
      args.push('--chain', String(options.chainDepth));
    }

    // Batch 2: node type targets bitmask
    if (options.targetMask && options.targetMask > 0) {
      args.push('--targets', String(options.targetMask));
    }
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
