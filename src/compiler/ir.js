import { diagnostics } from './diagnostics';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

// Chaos Budget Limits (prevents runaway complexity)
const CHAOS_LIMITS = {
    maxNewInstructions: 30,
    maxControlDepth: 3,
    maxEncodingOps: 10
};

// Chaos parameter themes
const CHAOS_THEMES = {
    'arithmetic': {
        weights: { subst: 0.9, opaque: 0.2, flatten: 0.1, number_encoding: 0.8 },
        name: 'Arithmetic Overload'
    },
    'control_flow': {
        weights: { subst: 0.3, opaque: 0.9, flatten: 0.8, number_encoding: 0.2 },
        name: 'Control Flow Maze'
    },
    'balanced': {
        weights: { subst: 0.6, opaque: 0.5, flatten: 0.4, number_encoding: 0.5 },
        name: 'Balanced Chaos'
    },
    'data_obfuscation': {
        weights: { subst: 0.4, opaque: 0.3, flatten: 0.2, number_encoding: 0.95 },
        name: 'Data Obfuscation'
    }
};

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR (Reproducibility)
// ============================================================================

let currentSeed = 1;

const seededRandom = () => {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
};

const setSeed = (seed) => {
    currentSeed = seed % 2147483647;
    if (currentSeed <= 0) currentSeed += 2147483646;
};

// ============================================================================
// CHAOS PLANNER
// ============================================================================

const generateChaosPlan = (ir, intensity, seed) => {
    if (seed !== undefined) setSeed(seed);

    const themes = Object.keys(CHAOS_THEMES);
    let selectedThemeKey = 'balanced';

    if (intensity === 'high') {
        selectedThemeKey = themes[Math.floor(seededRandom() * themes.length)];
    } else if (intensity === 'medium') {
        selectedThemeKey = seededRandom() > 0.5 ? 'balanced' : 'arithmetic';
    } else {
        selectedThemeKey = 'balanced';
    }

    const theme = CHAOS_THEMES[selectedThemeKey];
    const intensityMultiplier = intensity === 'high' ? 1.0 : (intensity === 'medium' ? 0.7 : 0.3);

    const plan = {
        theme: theme.name,
        weights: {},
        seed: currentSeed
    };

    for (const [k, v] of Object.entries(theme.weights)) {
        plan.weights[k] = v * intensityMultiplier;
    }

    return plan;
};

// ============================================================================
// IR GENERATION
// ============================================================================

export const generateIR = (node, ir = [], functions = {}) => {
    if (!node) return ir;

    switch (node.type) {
        case 'Program':
            node.body.forEach(stmt => generateIR(stmt, ir, functions));
            break;
        case 'FunctionDeclaration':
            if (node.name !== 'main') {
                functions[node.name] = node;
            } else {
                node.body.forEach(stmt => generateIR(stmt, ir, functions));
            }
            break;
        case 'VariableDeclaration':
            node.declarations.forEach(decl => {
                if (decl.init) {
                    const exprIr = generateExpressionIR(decl.init, ir, functions);
                    ir.push({ op: 'ASSIGN', target: decl.id, value: exprIr });
                } else {
                    ir.push({ op: 'ASSIGN', target: decl.id, value: 0 });
                }
            });
            break;
        case 'AssignmentStatement':
            const exprIr = generateExpressionIR(node.init, ir, functions);
            ir.push({ op: 'ASSIGN', target: node.id, value: exprIr });
            break;
        case 'ReturnStatement':
            if (node.argument) {
                const res = generateExpressionIR(node.argument, ir, functions);
                ir.push({ op: 'RETURN', value: res });
            } else {
                ir.push({ op: 'RETURN', value: 0 });
            }
            break;
        case 'IfStatement':
            ir.push({ op: 'IF', test: generateExpressionIR(node.test, ir, functions), consequent: generateIR(node.consequent, [], functions), alternate: node.alternate ? generateIR(node.alternate, [], functions) : null });
            break;
        case 'WhileStatement':
            ir.push({ op: 'WHILE', test: generateExpressionIR(node.test, ir, functions), body: generateIR(node.body, [], functions) });
            break;
        case 'BlockStatement':
            node.body.forEach(stmt => generateIR(stmt, ir, functions));
            break;
        case 'ArrayAssignment':
            const indexIr = generateExpressionIR(node.index, ir, functions);
            const valueIr = generateExpressionIR(node.value, ir, functions);
            ir.push({ op: 'STORE', target: node.id, index: indexIr, value: valueIr });
            break;
        case 'ExpressionStatement':
            generateExpressionIR(node.expression, ir, functions);
            break;
    }
    ir['functions'] = functions;
    return ir;
};

const generateExpressionIR = (node, ir, functions) => {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'Identifier') return node.name;

    if (node.type === 'CallExpression') {
        const args = node.arguments.map(arg => generateExpressionIR(arg, ir, functions));
        const temp = `t${ir.filter(i => ['ADD', 'MUL', 'SUB', 'DIV', 'CALL'].includes(i.op)).length}`;
        ir.push({ op: 'CALL', target: temp, name: node.callee.name, args });
        return temp;
    }

    if (node.type === 'BinaryExpression') {
        const left = generateExpressionIR(node.left, ir, functions);
        const right = generateExpressionIR(node.right, ir, functions);
        const temp = `t${ir.filter(i => ['ADD', 'MUL', 'SUB', 'DIV', 'LESS', 'GREATER'].includes(i.op)).length}`;
        const opMap = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '<': 'LESS', '>': 'GREATER' };
        ir.push({ op: opMap[node.operator], target: temp, left, right });
        return temp;
    }

    if (node.type === 'MemberExpression') {
        const index = generateExpressionIR(node.property, ir, functions);
        const temp = `t${ir.length}`;
        ir.push({ op: 'LOAD', target: temp, object: node.object.name, index });
        return temp;
    }

    if (node.type === 'SizeofExpression') {
        // Limitation: Mocked for 32-bit int target
        return 4;
    }
};

// ============================================================================
// CHAOS ENGINE (with Budget, Seeded RNG, and Negative Paths)
// ============================================================================

export const applyChaos = (ir, intensity = 'medium', seed = Date.now()) => {
    if (intensity === 'none') {
        diagnostics.emit('CHAOS_SKIPPED_DISABLED', 'chaos.safety', 'info', { reason: 'intensity_none' });
        return { ir: [...ir], transforms: [], seed };
    }

    // Initialize seed for reproducibility
    setSeed(seed);

    // Generate specific plan for this run
    const plan = generateChaosPlan(ir, intensity, seed);

    // Emit selection event
    diagnostics.emit('CHAOS_PLAN_SELECTED', 'chaos.planner', 'info', { strategy: plan.theme, intensity, seed });

    const chaoticIr = JSON.parse(JSON.stringify(ir));
    const transforms = [];

    // Budget tracking
    let budget = {
        instructionsAdded: 0,
        controlDepth: 0,
        encodingOps: 0
    };

    const addTransform = (name, context, id, params) => {
        if (!transforms.find(t => t.name === name)) {
            transforms.push({ name, count: 1 });
        } else {
            transforms.find(t => t.name === name).count++;
        }
        diagnostics.emit(id, context, 'info', params);
    };

    const checkBudget = (type, cost = 1) => {
        if (type === 'instructions' && budget.instructionsAdded + cost > CHAOS_LIMITS.maxNewInstructions) {
            return false;
        }
        if (type === 'control' && budget.controlDepth + cost > CHAOS_LIMITS.maxControlDepth) {
            return false;
        }
        if (type === 'encoding' && budget.encodingOps + cost > CHAOS_LIMITS.maxEncodingOps) {
            return false;
        }
        return true;
    };

    const processBlock = (block, blockId = 'main', depth = 0) => {
        const result = [];
        budget.controlDepth = Math.max(budget.controlDepth, depth);

        block.forEach((instr, idx) => {
            const w = plan.weights;

            // ----------------------------------------------------------------
            // 1. Number Encoding (with budget check)
            // ----------------------------------------------------------------
            if (seededRandom() < w.number_encoding &&
                instr.op === 'ASSIGN' &&
                typeof instr.value === 'number' &&
                Number.isInteger(instr.value)) {

                // Check budget constraints
                if (!checkBudget('encoding', 2)) {
                    diagnostics.emit('CHAOS_SKIPPED_BUDGET', 'chaos.safety', 'warning', {
                        reason: 'encoding_budget_exceeded',
                        block: blockId
                    });
                    result.push(instr);
                    return;
                }

                const val = instr.value;
                const offset = Math.floor(seededRandom() * 10) + 1;
                const t1 = `enc_add_${idx}`;

                result.push({ op: 'ADD', target: t1, left: val, right: offset, meta: 'CHAOS_NUM_ENC_ADD' });
                result.push({ op: 'SUB', target: instr.target, left: t1, right: offset, meta: 'CHAOS_NUM_ENC_SUB' });

                budget.instructionsAdded += 2;
                budget.encodingOps += 1;
                addTransform('Number Encoding', 'chaos.data.encoding', 'CHAOS_NUM_ENCODING', { orig: val, enc: `${t1} - ${offset}`, strategy: 'offset' });
                return;
            }

            // ----------------------------------------------------------------
            // 2. Instruction Substitution (ADD -> XOR/AND chain)
            // ----------------------------------------------------------------
            if (instr.op === 'ADD' && seededRandom() < w.subst) {
                // NEGATIVE PATH: Skip if division involved (potential UB)
                if (instr.left === 0 || instr.right === 0) {
                    diagnostics.emit('CHAOS_SKIPPED_SAFETY', 'chaos.safety', 'warning', {
                        reason: 'zero_operand',
                        block: blockId
                    });
                    result.push(instr);
                    return;
                }

                // NEGATIVE PATH: Budget check
                if (!checkBudget('instructions', 4)) {
                    diagnostics.emit('CHAOS_SKIPPED_BUDGET', 'chaos.safety', 'warning', {
                        reason: 'instruction_budget_exceeded',
                        block: blockId
                    });
                    result.push(instr);
                    return;
                }

                const t1 = `chaos_xor_${idx}`;
                const t2 = `chaos_and_${idx}`;
                const t3 = `chaos_mul_${idx}`;

                result.push({ op: 'XOR', target: t1, left: instr.left, right: instr.right, meta: 'CHAOS_SUBST_XOR' });
                result.push({ op: 'AND', target: t2, left: instr.left, right: instr.right, meta: 'CHAOS_SUBST_AND' });
                result.push({ op: 'MUL', target: t3, left: t2, right: 2, meta: 'CHAOS_SUBST_MUL' });
                result.push({ op: 'ADD', target: instr.target, left: t1, right: t3, meta: 'CHAOS_SUBST_FINAL' });

                budget.instructionsAdded += 4;
                addTransform('Instruction Substitution', 'chaos.substitution', 'CHAOS_SUBST_ADD', { block: blockId, instr: idx, left: instr.left, right: instr.right, op: 'ADD' });
                return;
            }

            // ----------------------------------------------------------------
            // 3. Opaque Predicate
            // ----------------------------------------------------------------
            if (seededRandom() < w.opaque && instr.op === 'ASSIGN') {
                // NEGATIVE PATH: Control depth exceeded
                if (!checkBudget('control', 1)) {
                    diagnostics.emit('CHAOS_SKIPPED_DEPTH', 'chaos.safety', 'warning', {
                        reason: 'control_depth_exceeded',
                        block: blockId
                    });
                    result.push(instr);
                    return;
                }

                // VALUE-DEPENDENT OPAQUE PREDICATE: (x*x + x) % 2 == 0 (always true for any integer x)
                const t_sq = `opaque_sq_${idx}`;
                const t_sum = `opaque_sum_${idx}`;
                const t_mod = `opaque_mod_${idx}`;
                const t_cond = `opaque_cond_${idx}`;
                const x = typeof instr.value === 'number' ? instr.value : 1;

                result.push({ op: 'MUL', target: t_sq, left: x, right: x, meta: 'CHAOS_OPAQUE_SQ' });
                result.push({ op: 'ADD', target: t_sum, left: t_sq, right: x, meta: 'CHAOS_OPAQUE_SUM' });
                result.push({ op: 'MOD', target: t_mod, left: t_sum, right: 2, meta: 'CHAOS_OPAQUE_MOD' });
                result.push({ op: 'EQUALS', target: t_cond, left: t_mod, right: 0 });
                result.push({
                    op: 'IF',
                    test: t_cond,
                    consequent: [instr],
                    alternate: [{ op: 'NOOP', meta: 'Dead Branch' }],
                    meta: 'CHAOS_OPAQUE_PREDICATE'
                });

                budget.instructionsAdded += 5;
                addTransform('Opaque Predicate', 'chaos.control_flow.opaque', 'CHAOS_OPAQUE_PRED', {
                    block: blockId,
                    invariant: '(x*x + x) % 2 == 0',
                    cond: '(x*x+x)%2==0',
                    valueBased: false
                });
                return;
            }

            // ----------------------------------------------------------------
            // 4. Control Flow Flattening (Lite)
            // ----------------------------------------------------------------
            if (seededRandom() < w.flatten && instr.op === 'ASSIGN') {
                // NEGATIVE PATH: Control depth exceeded
                if (!checkBudget('control', 1)) {
                    diagnostics.emit('CHAOS_SKIPPED_DEPTH', 'chaos.safety', 'warning', {
                        reason: 'control_depth_exceeded',
                        block: blockId
                    });
                    result.push(instr);
                    return;
                }

                result.push({
                    op: 'WHILE',
                    test: 1,
                    body: [
                        instr,
                        { op: 'BREAK', meta: 'Flattening Break' }
                    ],
                    meta: 'CHAOS_CF_FLATTENING_LITE'
                });
                budget.instructionsAdded += 2;
                budget.instructionsAdded += 2;
                addTransform('CF Flattening', 'chaos.control_flow.flatten', 'CHAOS_CF_FLATTEN', { block: blockId, type: 'loop_switch_lite', reason: 'straight_line_hidden' });
                return;
            }

            // Handle nested blocks (recursively with depth tracking)
            if (instr.consequent) instr.consequent = processBlock(instr.consequent, `if_${idx}`, depth + 1);
            if (instr.alternate) instr.alternate = processBlock(instr.alternate, `else_${idx}`, depth + 1);
            if (instr.body) instr.body = processBlock(instr.body, `while_${idx}`, depth + 1);

            // ----------------------------------------------------------------
            // 5. Commutativity Swap (algebraic identity)
            // ----------------------------------------------------------------
            if (['ADD', 'MUL'].includes(instr.op) && seededRandom() < w.subst) {
                const oldLeft = instr.left;
                instr.left = instr.right;
                instr.right = oldLeft;
                instr.meta = 'Swapped';
                addTransform('Commutativity Swap', 'chaos.algebraic', 'CHAOS_ALGEBRAIC_SWAP', { op: instr.op });
            }

            result.push(instr);
        });
        return result;
    };

    const finalIr = processBlock(chaoticIr);
    if (ir['functions']) finalIr['functions'] = ir['functions'];

    // Emit budget summary
    diagnostics.emit('CHAOS_BUDGET_SUMMARY', 'chaos.budget', 'info', {
        instructionsAdded: budget.instructionsAdded,
        maxInstructions: CHAOS_LIMITS.maxNewInstructions,
        controlDepth: budget.controlDepth,
        encodingOps: budget.encodingOps
    });

    return {
        ir: finalIr,
        transforms: transforms.map(t => `${t.name} (${t.count})`),
        seed,
        budget
    };
};

// ============================================================================
// IR EXECUTOR
// ============================================================================

export const executeIR = (ir, state = {}, stdout = [], functions = null, isNestedCall = false) => {
    let output = null;
    let returnValue = null;

    if (!functions && ir['functions']) {
        functions = ir['functions'];
    }

    const resolve = (val) => {
        if (typeof val === 'number') return val;
        if (state.hasOwnProperty(val)) return state[val];
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
            return val.slice(1, -1);
        }
        if (!isNaN(val) && typeof val === 'string') return parseFloat(val);
        return val !== undefined ? val : 0;
    };

    for (let instr of ir) {
        switch (instr.op) {
            case 'ASSIGN':
                state[instr.target] = resolve(instr.value);
                break;
            case 'ADD':
                state[instr.target] = resolve(instr.left) + resolve(instr.right);
                break;
            case 'SUB':
                state[instr.target] = resolve(instr.left) - resolve(instr.right);
                break;
            case 'MUL':
                state[instr.target] = resolve(instr.left) * resolve(instr.right);
                break;
            case 'XOR':
                state[instr.target] = resolve(instr.left) ^ resolve(instr.right);
                break;
            case 'AND':
                state[instr.target] = resolve(instr.left) & resolve(instr.right);
                break;
            case 'MOD':
                state[instr.target] = resolve(instr.left) % resolve(instr.right);
                break;
            case 'EQUALS':
                state[instr.target] = resolve(instr.left) == resolve(instr.right) ? 1 : 0;
                break;
            case 'DIV':
                const l = resolve(instr.left);
                const r = resolve(instr.right) || 1;
                const divRes = l / r;
                state[instr.target] = (l % 1 === 0 && r % 1 === 0) ? Math.floor(divRes) : divRes;
                break;
            case 'LESS':
                state[instr.target] = resolve(instr.left) < resolve(instr.right) ? 1 : 0;
                break;
            case 'GREATER':
                state[instr.target] = resolve(instr.left) > resolve(instr.right) ? 1 : 0;
                break;
            case 'BREAK':
                return 'BREAK';
            case 'NOOP':
                break;
            case 'IF':
                if (resolve(instr.test)) {
                    executeIR(instr.consequent, state, stdout, functions, isNestedCall);
                } else if (instr.alternate) {
                    executeIR(instr.alternate, state, stdout, functions, isNestedCall);
                }
                break;
            case 'WHILE':
                let iterations = 0;
                while (resolve(instr.test) && iterations < 1000) {
                    const res = executeIR(instr.body, state, stdout, functions, true);
                    if (res === 'BREAK') break;
                    iterations++;
                }
                break;
            case 'LOAD':
                const arr = state[instr.object] || [];
                state[instr.target] = arr[resolve(instr.index)] || 0;
                break;
            case 'STORE':
                if (!state[instr.target]) state[instr.target] = [];
                state[instr.target][resolve(instr.index)] = resolve(instr.value);
                break;
            case 'CALL':
                if (instr.name === 'printf') {
                    const resolvedArgs = instr.args.map(a => resolve(a));
                    let msg = resolvedArgs[0];
                    if (typeof msg === 'string') {
                        let argIndex = 1;
                        msg = msg.replace(/%(\\.?\\d*)?([dfs])/g, (match, precision, type) => {
                            let val = resolvedArgs[argIndex++];
                            if (val === undefined) return match;
                            if (type === 'f') {
                                if (precision && precision.startsWith('.')) {
                                    const p = parseInt(precision.slice(1));
                                    return Number(val).toFixed(p);
                                }
                                return Number(val).toString();
                            }
                            if (type === 'd') return Math.floor(Number(val)).toString();
                            return String(val);
                        });
                        stdout.push(msg);
                    } else {
                        stdout.push(resolvedArgs.join(' '));
                    }
                    state[instr.target] = 0;
                } else if (functions && functions[instr.name]) {
                    const func = functions[instr.name];
                    const funcState = {};
                    const resolvedArgs = instr.args.map(a => resolve(a));
                    if (func.params) {
                        func.params.forEach((param, i) => {
                            funcState[param.id] = resolvedArgs[i] !== undefined ? resolvedArgs[i] : 0;
                        });
                    }
                    const funcIR = [];
                    func.body.forEach(stmt => generateIR(stmt, funcIR, functions));
                    const result = executeIR(funcIR, funcState, [], functions, true);
                    state[instr.target] = typeof result === 'number' ? result : 0;
                } else {
                    state[instr.target] = 0;
                }
                break;
            case 'RETURN':
                returnValue = resolve(instr.value);
                if (isNestedCall) {
                    return returnValue;
                }
                break;
            case 'PRINT':
                output = resolve(instr.value);
                break;
        }
    }

    const result = output !== null ? output : (returnValue !== null ? returnValue : (state['result'] || 0));
    if (stdout.length > 0) {
        return stdout.join('');
    }
    return result;
};
