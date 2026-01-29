export const generateIR = (node, ir = [], functions = {}) => {
    if (!node) return ir;

    switch (node.type) {
        case 'Program':
            node.body.forEach(stmt => generateIR(stmt, ir, functions));
            break;
        case 'FunctionDeclaration':
            // Store function for later execution
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
                    // Default to 0 for uninitialized variables in IR
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
    ir.functions = functions;
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
        // Mock sizeof for now - in a real compiler this is a constant
        return 4; // Mocking int size
    }
};

export const applyChaos = (ir, intensity = 'medium') => {
    if (intensity === 'none') return { ir: [...ir], transforms: [] };
    const chaoticIr = JSON.parse(JSON.stringify(ir));
    const transforms = [];

    chaoticIr.forEach((instr, idx) => {
        // 1. Commutativity swap (Low/Medium/High)
        if (['ADD', 'MUL'].includes(instr.op) && Math.random() > 0.5) {
            const oldLeft = instr.left;
            instr.left = instr.right;
            instr.right = oldLeft;
            instr.meta = 'Swapped';
            if (!transforms.includes('Swapped operands')) transforms.push('Swapped operands');
        }

        // 2. Redundant loads (Medium/High)
        if (['medium', 'high'].includes(intensity) && Math.random() > 0.7 && idx > 0) {
            // Conceptually add a redundant load/store or just a note
            instr.meta = (instr.meta ? instr.meta + ', ' : '') + 'Redundant Load';
            if (!transforms.includes('Added redundant load')) transforms.push('Added redundant load');
        }
    });

    // 3. NOOP injection (High only)
    if (intensity === 'high') {
        const finalIr = [];
        chaoticIr.forEach(instr => {
            finalIr.push(instr);
            if (Math.random() > 0.6) {
                finalIr.push({ op: 'NOOP', meta: 'Chaos Injection' });
                if (!transforms.includes('Injected NOOP')) transforms.push('Injected NOOP');
            }
        });
        return { ir: finalIr, transforms };
    }

    return { ir: chaoticIr, transforms };
};

export const executeIR = (ir, state = {}, stdout = [], functions = null, isNestedCall = false) => {
    let output = null;
    let returnValue = null;
    
    // Extract functions from IR if available
    if (!functions && ir.functions) {
        functions = ir.functions;
    }

    const resolve = (val) => {
        if (typeof val === 'number') return val;
        if (state.hasOwnProperty(val)) return state[val];
        // Handle constant string patterns or return the string literal itself
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
            case 'IF':
                if (resolve(instr.test)) {
                    executeIR(instr.consequent, state, stdout, functions, isNestedCall);
                } else if (instr.alternate) {
                    executeIR(instr.alternate, state, stdout, functions, isNestedCall);
                }
                break;
            case 'WHILE':
                let iterations = 0;
                while (resolve(instr.test) && iterations < 1000) { // Safety break
                    executeIR(instr.body, state, stdout, functions, isNestedCall);
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
                // Handle printf
                if (instr.name === 'printf') {
                    const resolvedArgs = instr.args.map(a => resolve(a));
                    let msg = resolvedArgs[0];
                    if (typeof msg === 'string') {
                        let argIndex = 1;
                        // Replace %d, %f, %.nf etc.
                        msg = msg.replace(/%(\.?\d*)?([dfs])/g, (match, precision, type) => {
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
                    // Execute user-defined function
                    const func = functions[instr.name];
                    const funcState = {};
                    
                    // Map arguments to parameters
                    const resolvedArgs = instr.args.map(a => resolve(a));
                    if (func.params) {
                        func.params.forEach((param, i) => {
                            funcState[param.id] = resolvedArgs[i] !== undefined ? resolvedArgs[i] : 0;
                        });
                    }
                    
                    // Generate IR for function body
                    const funcIR = [];
                    func.body.forEach(stmt => generateIR(stmt, funcIR, functions));
                    
                    const result = executeIR(funcIR, funcState, [], functions, true);
                    state[instr.target] = typeof result === 'number' ? result : 0;
                } else {
                    state[instr.target] = 0; // Unknown function
                }
                break;
            case 'RETURN':
                returnValue = resolve(instr.value);
                // For nested function calls, return immediately to pass value back
                // For main, continue to collect all stdout first
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
