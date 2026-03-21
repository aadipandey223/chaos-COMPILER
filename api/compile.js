import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMPILER_BIN = path.resolve(
  __dirname,
  '../compiler',
  process.platform === 'win32' ? 'chaos-compiler.exe' : 'chaos-compiler'
);

async function runCompiler(filePath, options = {}) {
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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
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
    // Parse JSON body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { code, mutate, intensity, seed } = body;

    if (!code) {
      return res.status(400).json({
        ok: false,
        error: 'Provide code in request body.',
        type: 'compiler_error'
      });
    }

    // Write code to temp file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    tempFilePath = path.join(os.tmpdir(), `chaos-code-${uniqueSuffix}.c`);
    await fs.writeFile(tempFilePath, code);

    let result;
    try {
      result = await runCompiler(tempFilePath, {
        mutate: mutate !== false,
        intensity: intensity || 'low',
        seed: seed || null,
      });
    } catch (compilerError) {
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
    console.error('Compile error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error: ' + err.message,
      type: 'server_error'
    });
  } finally {
    if (tempFilePath) {
      try { await fs.unlink(tempFilePath); } catch (_) {}
    }
  }
}
