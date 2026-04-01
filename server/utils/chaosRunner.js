const { execFile } = require('child_process');
const path         = require('path');
const fs           = require('fs');
const os           = require('os');
const {
    parseWithTreeSitter
} = require('./treeSitterParser');

const COMPILER_BIN = process.env.COMPILER_PATH ||
    path.resolve(
        __dirname,
        process.platform === 'win32'
            ? '../../compiler/chaos-compiler.exe'
            : '../../compiler/chaos-compiler'
    );

async function runWithTreeSitter(sourceCode, fileExt,
                                  options = {}) {
    // Step 1: Parse with Tree-sitter (Node.js, fast)
    const ast = await parseWithTreeSitter(sourceCode, fileExt);

    if (!options.mutate) {
        // No mutation requested — return AST directly
        return { ast, mutations: [], warnings: null };
    }

    // Step 2: Write AST JSON to temp file
    const astTempPath = path.join(
        os.tmpdir(), `ast_${Date.now()}.json`
    );
    fs.writeFileSync(astTempPath,
        JSON.stringify(ast), 'utf8');

    // Step 3: Call C binary with --ast-file flag
    // The binary reads pre-parsed AST, runs chaos engine,
    // outputs { ast: <mutated>, mutations: [...] }
    const args = [
        'dummy.c',
        '--ast-file', astTempPath,
        '--json',
        '--mutate',
    ];

    if (options.count)
        args.push('--count', String(options.count));
    else
        args.push('--intensity', options.intensity || 'low');

    if (options.seed)
        args.push('--seed', String(options.seed));
    if (options.safeMode)
        args.push('--safe');
    if (options.chainDepth && options.chainDepth > 1)
        args.push('--chain', String(options.chainDepth));
    if (options.targetMask)
        args.push('--targets', String(options.targetMask));
    if (options.excludeFunctions?.length)
        args.push('--exclude-fns',
            options.excludeFunctions.join(','));
    if (options.excludeLines?.length)
        args.push('--exclude-lines',
            options.excludeLines.join(','));

    return new Promise((resolve, reject) => {
        execFile(COMPILER_BIN, args,
            { timeout: 15000 },
            (err, stdout, stderr) => {
                // Always clean up temp file
                try { fs.unlinkSync(astTempPath); }
                catch (_) {}

                if (err) {
                    if (err.killed)
                        return reject(new Error(
                            'Chaos engine timed out'
                        ));
                    return reject(new Error(
                        stderr || err.message
                    ));
                }

                try {
                    const result = JSON.parse(
                        stdout.trim()
                    );
                    resolve({
                        ast:       result.ast       || ast,
                        mutations: result.mutations || [],
                        warnings:  stderr || null,
                    });
                } catch (e) {
                    // JSON parse failed —
                    // return Tree-sitter AST with no mutations
                    console.warn(
                        'chaosRunner: binary output ' +
                        'parse failed, returning ' +
                        'Tree-sitter AST only'
                    );
                    resolve({
                        ast,
                        mutations: [],
                        warnings:  'Mutation engine output ' +
                                   'could not be parsed',
                    });
                }
            }
        );
    });
}

module.exports = { runWithTreeSitter };