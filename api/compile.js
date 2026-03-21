const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const COMPILER_BIN = path.resolve(
  __dirname,
  '../compiler',
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
    // Timeout: 30s for Vercel (adjust based on plan), 10s for local
    const timeout = process.env.VERCEL ? 30000 : 10000;
    execFile(COMPILER_BIN, args, { timeout }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          return reject(new Error(`Compiler timed out after ${timeout / 1000}s`));
        }
        return reject(new Error(stderr || stdout || error.message));
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve({
          ast: result.ast || result,
          mutations: result.mutations || [],
          stderr: stderr || null,
        });
      } catch (e) {
        reject(new Error(`Failed to parse compiler output:\n${stdout}`));
      }
    });
  });
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let tempFilePath = null;

  try {
    // Verify compiler binary exists
    try {
      await fs.access(COMPILER_BIN);
    } catch {
      console.error(`Compiler binary not found at: ${COMPILER_BIN}`);
      return res.status(500).json({
        ok: false,
        error: 'Compiler binary not found. Please rebuild and redeploy.',
        type: 'deployment_error'
      });
    }

    // Parse JSON body (Vercel automatically parses application/json)
    const body = req.body || {};
    const { code, mutate, intensity, seed } = body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Provide code in request body as a string.',
        type: 'compiler_error'
      });
    }

    // Write code to temp file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    tempFilePath = path.join(os.tmpdir(), `chaos-code-${uniqueSuffix}.c`);
    
    try {
      await fs.writeFile(tempFilePath, code, 'utf8');
    } catch (err) {
      console.error('Failed to write temp file:', err);
      return res.status(500).json({
        ok: false,
        error: 'Failed to write temporary file.',
        type: 'server_error'
      });
    }

    let result;
    try {
      result = await runCompiler(tempFilePath, {
        mutate: mutate !== false,
        intensity: intensity || 'low',
        seed: seed || null,
      });
    } catch (compilerError) {
      console.error('Compiler error:', compilerError);
      return res.status(400).json({
        ok: false,
        error: compilerError.message,
        type: 'compiler_error'
      });
    }

    return res.status(200).json({
      ok: true,
      ast: result.ast,
      mutations: result.mutations,
      warnings: result.stderr || null,
    });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error: ' + err.message,
      type: 'server_error'
    });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try { 
        await fs.unlink(tempFilePath); 
      } catch (_) {
        // Ignore cleanup errors
      }
    }
  }
};
