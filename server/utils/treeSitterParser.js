const TreeSitter = require('web-tree-sitter');
const Parser = TreeSitter;
const Language = TreeSitter.Language;
const path   = require('path');
const fs     = require('fs');

let parserC   = null;
let parserCpp = null;
let initialized = false;

function resolveNodeModuleFile(...segments) {
    const candidates = [
        path.join(__dirname, '..', 'node_modules', ...segments),
        path.join(__dirname, '..', '..', 'node_modules', ...segments),
    ];

    for (const filePath of candidates) {
        if (fs.existsSync(filePath)) return filePath;
    }

    throw new Error(`Unable to locate dependency file: ${segments.join('/')}`);
}

async function initParsers() {
    if (initialized) return;
    await Parser.init({
        locateFile: (scriptName) => {
            if (scriptName === 'tree-sitter.wasm') {
                return resolveNodeModuleFile('web-tree-sitter', 'tree-sitter.wasm');
            }
            return scriptName;
        }
    });

    const langC = await Parser.Language.load(
        resolveNodeModuleFile('tree-sitter-wasms', 'out', 'tree-sitter-c.wasm')
    );
    const langCpp = await Parser.Language.load(
        resolveNodeModuleFile('tree-sitter-wasms', 'out', 'tree-sitter-cpp.wasm')
    );

    parserC = new Parser();
    parserC.setLanguage(langC);

    parserCpp = new Parser();
    parserCpp.setLanguage(langCpp);

    initialized = true;
}

/*
 * Main export — parse source code and return chaos-compatible AST.
 * fileExt: '.c' or '.cpp' — selects grammar
 */
async function parseWithTreeSitter(sourceCode, fileExt = '.c') {
    await initParsers();

    const parser = fileExt === '.cpp' ? parserCpp : parserC;
    const tree   = parser.parse(sourceCode);

    if (tree.rootNode.hasError) {
        console.warn(
            'treeSitter: parse errors detected — ' +
            'proceeding with partial AST'
        );
    }

    const ast = convertNode(tree.rootNode, sourceCode);
    return ast;
}

/*
 * Recursive converter — maps Tree-sitter node types
 * to the chaos engine's node type strings.
 */
function convertNode(tsNode, src) {
    if (!tsNode) return null;

    const line = tsNode.startPosition.row + 1;
    const col  = tsNode.startPosition.column + 1;
    const text = src.slice(tsNode.startIndex, tsNode.endIndex);

    const SKIP_TYPES = new Set([
        ',', ';', '(', ')', '{', '}', '[', ']',
        'comment', 'ERROR'
    ]);
    if (SKIP_TYPES.has(tsNode.type)) return null;

    const node = makeNode('Unknown', null, line, col);

    switch (tsNode.type) {
        case 'translation_unit': {
            node.type = 'Program';
            node.children = convertChildren(tsNode.children, src);
            break;
        }
        case 'function_definition': {
            node.type  = 'FuncDecl';
            const decl = findChild(tsNode, 'function_declarator');
            if (decl) {
                const nameNode = findChild(decl, 'identifier');
                node.value = nameNode
                    ? src.slice(nameNode.startIndex, nameNode.endIndex)
                    : 'unknown';
                const params = findChild(decl, 'parameter_list');
                if (params) {
                    node.children = params.children
                        .filter(p => p.type === 'parameter_declaration')
                        .map(p => convertParamDecl(p, src))
                        .filter(Boolean);
                }
            }
            const body = findChild(tsNode, 'compound_statement');
            if (body) node.right = convertNode(body, src);
            break;
        }
        case 'compound_statement': {
            node.type     = 'Block';
            node.children = convertChildren(tsNode.children, src);
            break;
        }
        case 'if_statement': {
            node.type = 'If';
            const condNode = tsNode.childForFieldName('condition');
            if (condNode) node.cond = convertNode(condNode, src);
            const conseq = tsNode.childForFieldName('consequence');
            if (conseq) node.left = convertNode(conseq, src);
            const alt = tsNode.childForFieldName('alternative');
            if (alt) node.right = convertNode(alt, src);
            break;
        }
        case 'while_statement': {
            node.type = 'While';
            const condNode = tsNode.childForFieldName('condition');
            if (condNode) node.cond = convertNode(condNode, src);
            const bodyNode = tsNode.childForFieldName('body');
            if (bodyNode) node.left = convertNode(bodyNode, src);
            break;
        }
        case 'for_statement': {
            node.type = 'While';
            node.value = 'for';
            const init = tsNode.childForFieldName('initializer');
            const cond = tsNode.childForFieldName('condition');
            const update = tsNode.childForFieldName('update');
            const forBody = tsNode.childForFieldName('body');
            
            if (cond) node.cond = convertNode(cond, src);
            
            const syntheticBlock = makeNode('Block', null, line, col);
            if (init) {
                const initNode = convertNode(init, src);
                if (initNode) syntheticBlock.children.push(initNode);
            }
            if (forBody) {
                const bodyNode = convertNode(forBody, src);
                if (bodyNode) {
                    if (bodyNode.type === 'Block') {
                        syntheticBlock.children.push(...bodyNode.children);
                    } else {
                        syntheticBlock.children.push(bodyNode);
                    }
                }
            }
            if (update) {
                const updateNode = convertNode(update, src);
                if (updateNode) syntheticBlock.children.push(updateNode);
            }
            node.left = syntheticBlock;
            break;
        }
        case 'return_statement': {
            node.type = 'Return';
            const expr = tsNode.children.find(c => c.type !== 'return' && c.type !== ';');
            if (expr) node.left = convertNode(expr, src);
            break;
        }
        case 'declaration': {
            node.type = 'VarDecl';
            const declarator = findChild(tsNode, 'init_declarator') || findChild(tsNode, 'identifier');
            if (declarator) {
                const nameNode = findChild(declarator, 'identifier');
                node.value = nameNode
                    ? src.slice(nameNode.startIndex, nameNode.endIndex)
                    : src.slice(declarator.startIndex, declarator.endIndex);
                
                const valNode = declarator.childForFieldName
                    ? declarator.childForFieldName('value')
                    : null;
                if (valNode) node.left = convertNode(valNode, src);
            }
            break;
        }
        case 'expression_statement': {
            node.type = 'ExprStmt';
            const inner = tsNode.children.find(c => c.type !== ';');
            if (inner) node.left = convertNode(inner, src);
            break;
        }
        case 'binary_expression': {
            node.type = 'BinaryOp';
            node.value = src.slice(tsNode.children[1].startIndex, tsNode.children[1].endIndex);
            node.left  = convertNode(tsNode.children[0], src);
            node.right = convertNode(tsNode.children[2], src);
            break;
        }
        case 'assignment_expression': {
            const op = tsNode.childForFieldName ? tsNode.childForFieldName('operator') : tsNode.children[1];
            const opText = op ? src.slice(op.startIndex, op.endIndex) : '=';
            if (opText === '=') {
                node.type  = 'Assign';
                const lhs  = tsNode.childForFieldName ? tsNode.childForFieldName('left') : tsNode.children[0];
                const rhs  = tsNode.childForFieldName ? tsNode.childForFieldName('right') : tsNode.children[2];
                if (lhs) node.value = src.slice(lhs.startIndex, lhs.endIndex);
                if (rhs) node.left  = convertNode(rhs, src);
            } else {
                node.type  = 'BinaryOp';
                node.value = opText;
                node.left  = convertNode(tsNode.children[0], src);
                node.right = convertNode(tsNode.children[2], src);
            }
            break;
        }
        case 'unary_expression': {
            node.type  = 'UnaryOp';
            const opNode = tsNode.children.find(c => c.isNamed === false);
            node.value = opNode ? src.slice(opNode.startIndex, opNode.endIndex) : '!';
            const operand = tsNode.children.find(c => c !== opNode);
            if (operand) node.left = convertNode(operand, src);
            break;
        }
        case 'call_expression': {
            node.type = 'Call';
            const fn = tsNode.childForFieldName ? tsNode.childForFieldName('function') : tsNode.children[0];
            if (fn) node.value = src.slice(fn.startIndex, fn.endIndex);
            const argList = tsNode.childForFieldName ? tsNode.childForFieldName('arguments') : findChild(tsNode, 'argument_list');
            if (argList) {
                node.children = argList.children
                    .filter(c => c.type !== '(' && c.type !== ')' && c.type !== ',')
                    .map(c => convertNode(c, src))
                    .filter(Boolean);
            }
            break;
        }
        case 'number_literal':
        case 'integer_literal':
        case 'float_literal': {
            node.type  = 'Number';
            node.value = text;
            break;
        }
        case 'string_literal':
        case 'char_literal': {
            node.type  = 'String';
            node.value = text;
            break;
        }
        case 'identifier': {
            node.type  = 'Ident';
            node.value = text;
            break;
        }
        case 'pointer_expression': {
            node.type  = 'UnaryOp';
            node.value = text[0];
            const operand = tsNode.children.find(c => c.isNamed);
            if (operand) node.left = convertNode(operand, src);
            break;
        }
        case 'field_expression': {
            node.type  = 'BinaryOp';
            node.value = tsNode.children[1] ? src.slice(tsNode.children[1].startIndex, tsNode.children[1].endIndex) : '.';
            node.left  = convertNode(tsNode.children[0], src);
            node.right = convertNode(tsNode.children[2], src);
            break;
        }
        case 'subscript_expression': {
            node.type  = 'BinaryOp';
            node.value = '[]';
            node.left  = convertNode(tsNode.children[0], src);
            node.right = convertNode(tsNode.children[2], src);
            break;
        }
        case 'conditional_expression': {
            node.type  = 'If';
            node.value = 'ternary';
            node.cond  = convertNode(tsNode.children[0], src);
            node.left  = convertNode(tsNode.children[2], src);
            node.right = convertNode(tsNode.children[4], src);
            break;
        }
        case 'struct_specifier': {
            node.type  = 'VarDecl';
            node.value = 'struct';
            node.children = convertChildren(tsNode.children, src);
            break;
        }
        case 'parenthesized_expression': {
            const inner = tsNode.children.find(c => c.type !== '(' && c.type !== ')');
            if (inner) return convertNode(inner, src);
            break;
        }
        case 'preproc_include':
        case 'preproc_def':
        case 'preproc_function_def':
        case 'preproc_ifdef':
        case 'preproc_if':
        case 'preproc_else':
        case 'preproc_endif':
        case 'preproc_call': {
            return null;
        }
        default: {
            node.type  = 'ExprStmt';
            node.value = tsNode.type;
            node.children = convertChildren(tsNode.children, src);
            if (!node.children.length) return null;
            break;
        }
    }

    return node;
}

function makeNode(type, value, line, col) {
    return {
        type, value: value || null, line, col,
        left: null, right: null, cond: null,
        children: [], child_count: 0,
    };
}

function convertChildren(children, src) {
    return (children || []).map(c => convertNode(c, src)).filter(Boolean);
}

function findChild(node, type) {
    return (node.children || []).find(c => c.type === type);
}

function convertParamDecl(paramNode, src) {
    const nameNode = findChild(paramNode, 'identifier') || paramNode.children.find(c => c.type === 'identifier');
    return makeNode(
        'VarDecl',
        nameNode ? src.slice(nameNode.startIndex, nameNode.endIndex) : 'param',
        paramNode.startPosition.row + 1,
        paramNode.startPosition.column + 1
    );
}

function fixChildCounts(node) {
    if (!node) return node;
    node.child_count = node.children ? node.children.length : 0;
    if (node.children) node.children.forEach(fixChildCounts);
    fixChildCounts(node.left);
    fixChildCounts(node.right);
    fixChildCounts(node.cond);
    return node;
}

module.exports = {
    parseWithTreeSitter: async (code, ext) => {
        const ast = await parseWithTreeSitter(code, ext);
        return fixChildCounts(ast);
    }
};