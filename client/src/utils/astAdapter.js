const ALIAS_MAP = {
  'Program': 'root of the AST',
  'FunctionDeclaration': 'defines a named function',
  'BlockStatement': 'a grouped sequence of statements',
  'VariableDeclaration': 'declares a local variable',
  'IfStatement': 'conditionally executes a block',
  'ReturnStatement': 'exits a function with a value',
  'ForStatement': 'a loop based on an initializer, condition, and step',
  'BinaryExpression': 'combines two values with an operator',
  'UnaryExpression': 'applies an operator to one value',
  'AssignmentExpression': 'assigns a value to a variable',
  'ExpressionStatement': 'a statement made of one expression',
  'CallExpression': 'calls a function',
  'Identifier': 'references a variable or function',
  'NumericLiteral': 'a hardcoded number value',
  'StringLiteral': 'a hardcoded text value'
};

function extractSnippet(originalCode, line) {
  if (!originalCode || !line) return null;
  const lines = originalCode.split('\n');
  if (line > 0 && line <= lines.length) {
    return lines[line - 1].trim();
  }
  return null;
}

function adaptNode(node, role, originalCode = '', parentType = null, parentLabel = null, allMutations = []) {
  if (!node) return null;

  const children = [];
  const currentLabel = node.value ? `${node.type} ${node.value}` : node.type;

  if (node.cond) {
    const condChild = adaptNode(node.cond, 'cond', originalCode, node.type, currentLabel, allMutations);
    if (condChild) children.push(condChild);
  }

  if (node.left) {
    const leftChild = adaptNode(node.left, 'left', originalCode, node.type, currentLabel, allMutations);
    if (leftChild) children.push(leftChild);
  }

  if (node.right) {
    const rightChild = adaptNode(node.right, 'right', originalCode, node.type, currentLabel, allMutations);
    if (rightChild) children.push(rightChild);
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      const adaptedChild = adaptNode(child, 'child', originalCode, node.type, currentLabel, allMutations);
      if (adaptedChild) children.push(adaptedChild);
    });
  }

  const snippet = extractSnippet(originalCode, node.line);
  
  // Find mutation exactly matching this node's line and possibly involving its value 
  // (In a real system, you'd match by exact AST node ID, but line is our best proxy here)
  let mutation = null;
  if (node.line) {
     mutation = allMutations.find(m => m.line === node.line) || null;
  }
  
  // Build context based on node type
  const context = { raw: node.value };
  if (node.type === 'FunctionDeclaration') {
     context.fnName = node.value || 'anonymous';
     context.returnType = 'int'; // Simplified assumption for toy C
     context.paramCount = node.children ? node.children.length : 0;
  } else if (node.type === 'VariableDeclaration') {
     context.varName = node.value || '';
     context.varType = 'int';
  } else if (node.type === 'BinaryExpression') {
     context.operator = node.value || '';
  }

  return {
    name: currentLabel,
    meta: {
      id: Math.random().toString(36).substr(2, 9),
      type: node.type,
      alias: ALIAS_MAP[node.type] || 'AST node',
      value: node.value || null,
      line: node.line || null,
      colStart: node.col || null,
      colEnd: node.col ? node.col + (node.value ? node.value.length : 1) : null,
      snippet: snippet,
      parentType: parentType,
      parentLabel: parentLabel,
      mutated: !!mutation,
      mutation: mutation,
      context: context,
      directChildren: children.map(c => ({ type: c.meta.type, label: c.name }))
    },
    children: children,
  };
}

export function adaptAst(rawAst, originalCode = '', mutations = []) {
  if (!rawAst) return null;
  return adaptNode(rawAst, 'root', originalCode, null, null, mutations);
}

export function buildReplaySteps(root) {
  const steps = [];
  root.each(node => {
    /* Step 1: the node itself */
    steps.push({ kind: 'node', node });
    /* Step 2: the edge to this node's parent */
    if (node.parent) {
      steps.push({ kind: 'edge', node });
    }
  });
  return steps;
}
