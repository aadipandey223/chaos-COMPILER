const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const outputPath = path.join('compiler', isWindows ? 'chaos-compiler.exe' : 'chaos-compiler');

const sourceFiles = [
  path.join('compiler', 'main.c'),
  path.join('compiler', 'lexer.c'),
  path.join('compiler', 'parser.c'),
  path.join('compiler', 'ast.c'),
  path.join('compiler', 'chaos.c'),
];

const compilers = isWindows
  ? ['gcc', 'clang', 'cc']
  : ['gcc', 'clang', 'cc'];

const baseArgs = ['-O2', ...sourceFiles, '-o', outputPath, '-lm'];

function tryCompile(compiler) {
  const result = spawnSync(compiler, baseArgs, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error && result.error.code === 'ENOENT') {
    return { ok: false, missing: true };
  }

  return {
    ok: result.status === 0,
    missing: false,
    status: result.status,
  };
}

for (const compiler of compilers) {
  const result = tryCompile(compiler);
  if (result.ok) {
    console.log(`[build-compiler] Built native compiler using ${compiler}.`);
    process.exit(0);
  }
  if (!result.missing) {
    console.warn(`[build-compiler] ${compiler} failed with exit code ${result.status}. Trying next compiler.`);
  }
}

if (process.env.REQUIRE_NATIVE_COMPILER === '1') {
  console.error('[build-compiler] No working C compiler found and REQUIRE_NATIVE_COMPILER=1.');
  process.exit(1);
}

console.warn('[build-compiler] No C compiler found. Continuing without native chaos binary.');
process.exit(0);
