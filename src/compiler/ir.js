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

export const applyChaos = (ir, intensity = 'medium', seed = Date.now(), config = null) => {
    if (intensity === 'none') {
        diagnostics.emit('CHAOS_SKIPPED_DISABLED', 'chaos.safety', 'info', { reason: 'intensity_none' });
        return { ir: [...ir], snapshots: [{ name: 'Original', ir: [...ir] }], transforms: [], seed };
    }

    // Default config if not provided
    const defaultConfig = {
        passes: {
            numberEncoding: true,
            substitution: true,
            opaquePredicates: true,
            flattening: true
        },
        customRules: []
    };
    const activeConfig = config || defaultConfig;

    setSeed(seed);
    const plan = generateChaosPlan(ir, intensity, seed);
    diagnostics.emit('CHAOS_PLAN_SELECTED', 'chaos.planner', 'info', { strategy: plan.theme, intensity, seed });

    let currentIr = JSON.parse(JSON.stringify(ir));
    const snapshots = [{ name: 'Original', ir: JSON.parse(JSON.stringify(currentIr)) }];
    const transforms = [];

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
            diagnostics.emit('CHAOS_BUDGET_EXHAUSTED', 'chaos.budget.limit', 'warning', 
                { type: 'instructions', limit: CHAOS_LIMITS.maxNewInstructions, current: budget.instructionsAdded });
            return false;
        }
        if (type === 'control' && budget.controlDepth + cost > CHAOS_LIMITS.maxControlDepth) {
            diagnostics.emit('CHAOS_BUDGET_EXHAUSTED', 'chaos.budget.limit', 'warning', 
                { type: 'control', limit: CHAOS_LIMITS.maxControlDepth, current: budget.controlDepth });
            return false;
        }
        if (type === 'encoding' && budget.encodingOps + cost > CHAOS_LIMITS.maxEncodingOps) {
            diagnostics.emit('CHAOS_BUDGET_EXHAUSTED', 'chaos.budget.limit', 'warning', 
                { type: 'encoding', limit: CHAOS_LIMITS.maxEncodingOps, current: budget.encodingOps });
            return false;
        }
        return true;
    };

    // --- Pass 1: Number Encoding ---
    if (activeConfig.passes.numberEncoding) {
        const pass1 = (block, bId = 'main', d = 0) => {
            const res = [];
            block.forEach((instr, idx) => {
                if (plan.weights.number_encoding > 0 && seededRandom() < plan.weights.number_encoding &&
                    instr.op === 'ASSIGN' && typeof instr.value === 'number' && Number.isInteger(instr.value)) {
                    if (checkBudget('encoding', 2)) {
                        const val = instr.value;
                        const offset = Math.floor(seededRandom() * 10) + 1;
                        const t1 = `enc_add_${idx}_${d}`;
                        res.push({ op: 'ADD', target: t1, left: val, right: offset, meta: 'CHAOS_NUM_ENC_ADD' });
                        res.push({ op: 'SUB', target: instr.target, left: t1, right: offset, meta: 'CHAOS_NUM_ENC_SUB' });
                        budget.instructionsAdded += 2;
                        budget.encodingOps += 1;
                        addTransform('Number Encoding', 'chaos.data.encoding', 'CHAOS_NUM_ENCODING', { orig: val, enc: `${t1} - ${offset}` });
                        return;
                    }
                }
                if (instr.consequent) instr.consequent = pass1(instr.consequent, `if_${idx}`, d + 1);
                if (instr.alternate) instr.alternate = pass1(instr.alternate, `else_${idx}`, d + 1);
                if (instr.body) instr.body = pass1(instr.body, `while_${idx}`, d + 1);
                res.push(instr);
            });
            return res;
        };
        currentIr = pass1(currentIr);
        snapshots.push({ name: 'Number Encoding', ir: JSON.parse(JSON.stringify(currentIr)) });
    }

    // --- Pass 2: Instruction Substitution ---
    if (activeConfig.passes.substitution) {
        const pass2 = (block, bId = 'main', d = 0) => {
            const res = [];
            block.forEach((instr, idx) => {
                if (instr.op === 'ADD' && seededRandom() < plan.weights.subst) {
                    if (instr.left !== 0 && instr.right !== 0 && checkBudget('instructions', 4)) {
                        const t1 = `chaos_xor_${idx}_${d}`;
                        const t2 = `chaos_and_${idx}_${d}`;
                        const t3 = `chaos_mul_${idx}_${d}`;
                        res.push({ op: 'XOR', target: t1, left: instr.left, right: instr.right, meta: 'CHAOS_SUBST_XOR' });
                        res.push({ op: 'AND', target: t2, left: instr.left, right: instr.right, meta: 'CHAOS_SUBST_AND' });
                        res.push({ op: 'MUL', target: t3, left: t2, right: 2, meta: 'CHAOS_SUBST_MUL' });
                        res.push({ op: 'ADD', target: instr.target, left: t1, right: t3, meta: 'CHAOS_SUBST_FINAL' });
                        budget.instructionsAdded += 4;
                        addTransform('Instruction Substitution', 'chaos.substitution', 'CHAOS_SUBST_ADD', { block: bId, op: 'ADD' });
                        return;
                    }
                }
                if (instr.consequent) instr.consequent = pass2(instr.consequent, `if_${idx}`, d + 1);
                if (instr.alternate) instr.alternate = pass2(instr.alternate, `else_${idx}`, d + 1);
                if (instr.body) instr.body = pass2(instr.body, `while_${idx}`, d + 1);
                res.push(instr);
            });
            return res;
        };
        currentIr = pass2(currentIr);
        snapshots.push({ name: 'Substitution', ir: JSON.parse(JSON.stringify(currentIr)) });
    }

    // --- Pass 3: Opaque Predicates ---
    if (activeConfig.passes.opaquePredicates) {
        const pass3 = (block, bId = 'main', d = 0) => {
            const res = [];
            block.forEach((instr, idx) => {
                if (seededRandom() < plan.weights.opaque && instr.op === 'ASSIGN') {
                    if (checkBudget('control', 1)) {
                        const t_sq = `opaque_sq_${idx}_${d}`;
                        const t_sum = `opaque_sum_${idx}_${d}`;
                        const t_mod = `opaque_mod_${idx}_${d}`;
                        const t_cond = `opaque_cond_${idx}_${d}`;
                        const x = typeof instr.value === 'number' ? instr.value : 1;
                        res.push({ op: 'MUL', target: t_sq, left: x, right: x, meta: 'CHAOS_OPAQUE_SQ' });
                        res.push({ op: 'ADD', target: t_sum, left: t_sq, right: x, meta: 'CHAOS_OPAQUE_SUM' });
                        res.push({ op: 'MOD', target: t_mod, left: t_sum, right: 2, meta: 'CHAOS_OPAQUE_MOD' });
                        res.push({ op: 'EQUALS', target: t_cond, left: t_mod, right: 0 });
                        res.push({ op: 'IF', test: t_cond, consequent: [instr], alternate: [{ op: 'NOOP', meta: 'Dead Branch' }], meta: 'CHAOS_OPAQUE_PREDICATE' });
                        budget.instructionsAdded += 5;
                        addTransform('Opaque Predicate', 'chaos.control_flow.opaque', 'CHAOS_OPAQUE_PRED', { block: bId });
                        return;
                    }
                }
                if (instr.consequent) instr.consequent = pass3(instr.consequent, `if_${idx}`, d + 1);
                if (instr.alternate) instr.alternate = pass3(instr.alternate, `else_${idx}`, d + 1);
                if (instr.body) instr.body = pass3(instr.body, `while_${idx}`, d + 1);
                res.push(instr);
            });
            return res;
        };
        currentIr = pass3(currentIr);
        snapshots.push({ name: 'Opaque Predicates', ir: JSON.parse(JSON.stringify(currentIr)) });
    }

    // --- Pass 4: Control flow Flattening ---
    if (activeConfig.passes.flattening) {
        const pass4 = (block, bId = 'main', d = 0) => {
            const res = [];
            block.forEach((instr, idx) => {
                if (seededRandom() < plan.weights.flatten && instr.op === 'ASSIGN') {
                    if (checkBudget('control', 1)) {
                        res.push({ op: 'WHILE', test: 1, body: [instr, { op: 'BREAK', meta: 'Flattening Break' }], meta: 'CHAOS_CF_FLATTENING_LITE' });
                        budget.instructionsAdded += 2;
                        addTransform('CF Flattening', 'chaos.control_flow.flatten', 'CHAOS_CF_FLATTEN', { block: bId });
                        return;
                    }
                }
                if (instr.consequent) instr.consequent = pass4(instr.consequent, `if_${idx}`, d + 1);
                if (instr.alternate) instr.alternate = pass4(instr.alternate, `else_${idx}`, d + 1);
                if (instr.body) instr.body = pass4(instr.body, `while_${idx}`, d + 1);
                res.push(instr);
            });
            return res;
        };
        currentIr = pass4(currentIr);
        snapshots.push({ name: 'Final IR (Flattening)', ir: JSON.parse(JSON.stringify(currentIr)) });
    }

    // --- Pass 5: Custom Mutation Rules ---
    const ruleHits = {};
    if (activeConfig.customRules.length > 0) {
        const pass5 = (block) => {
            const res = [];
            block.forEach((instr, idx) => {
                const rule = activeConfig.customRules.find(r => r.source === instr.op);
                if (rule) {
                    ruleHits[rule.id] = (ruleHits[rule.id] || 0) + 1;
                    const ops = rule.target.split(',').map(s => s.trim());
                    ops.forEach((op, oIdx) => {
                        const isFinal = oIdx === ops.length - 1;
                        const newInstr = {
                            op,
                            target: isFinal ? instr.target : `custom_${instr.target}_${idx}_${oIdx}`,
                            meta: `CUSTOM_RULE_${rule.source}`
                        };

                        // Heuristic: map inputs if possible
                        if (instr.left !== undefined) newInstr.left = instr.left;
                        if (instr.right !== undefined) newInstr.right = instr.right;
                        if (instr.value !== undefined) newInstr.value = instr.value;

                        res.push(newInstr);
                        budget.instructionsAdded++;
                    });
                    addTransform('Custom Mutation', 'chaos.custom', 'CHAOS_CUSTOM_MUTATION', { op: instr.op });
                    return;
                }

                if (instr.consequent) instr.consequent = pass5(instr.consequent);
                if (instr.alternate) instr.alternate = pass5(instr.alternate);
                if (instr.body) instr.body = pass5(instr.body);
                res.push(instr);
            });
            return res;
        };
        currentIr = pass5(currentIr);
        snapshots.push({ name: 'Custom Mutations', ir: JSON.parse(JSON.stringify(currentIr)) });
    }

    if (ir['functions']) currentIr['functions'] = ir['functions'];

    diagnostics.emit('CHAOS_BUDGET_SUMMARY', 'chaos.budget', 'info', {
        instructionsAdded: budget.instructionsAdded,
        maxInstructions: CHAOS_LIMITS.maxNewInstructions,
        controlDepth: budget.controlDepth
    });

    return {
        ir: currentIr,
        snapshots,
        transforms: transforms.map(t => `${t.name} (${t.count})`),
        seed,
        budget,
        ruleHits
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
