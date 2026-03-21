function adaptNode(node, role) {
  if (!node) return null;

  const children = [];

  if (node.cond) {
    const condChild = adaptNode(node.cond, 'cond');
    if (condChild) children.push(condChild);
  }

  if (node.left) {
    const leftChild = adaptNode(node.left, 'left');
    if (leftChild) children.push(leftChild);
  }

  if (node.right) {
    const rightChild = adaptNode(node.right, 'right');
    if (rightChild) children.push(rightChild);
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      const adaptedChild = adaptNode(child, 'child');
      if (adaptedChild) children.push(adaptedChild);
    });
  }

  return {
    name: node.value ? `${node.type} ${node.value}` : node.type,
    meta: {
      type: node.type,
      value: node.value || null,
      line: node.line || null,
      col: node.col || null,
      role: role,
    },
    children: children, // Always an array
  };
}

export function adaptAst(rawAst) {
  if (!rawAst) return null;
  return adaptNode(rawAst, 'root');
}
