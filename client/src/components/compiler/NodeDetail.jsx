import React from 'react';
import styles from './NodeDetail.module.css';

const DEFAULT_DESCRIPTION = "AST node.";

const descriptionMap = {
  Program:   "Root of the file. Contains all top-level functions and declarations.",
  FuncDecl:  "Function definition. value = function name. Children are parameters, right = body block.",
  VarDecl:   "Variable declaration. value = variable name. left = initial value expression (if any).",
  Block:     "A { } block. Children are the statements inside it.",
  Return:    "Return statement. left = returned expression.",
  If:        "If statement. cond = condition, left = then block, right = else block (may be absent).",
  While:     "While loop. cond = condition, left = body.",
  BinaryOp:  "Two-operand expression. value = operator (+,-,*,/,==,!=,<,>). left and right = operands.",
  UnaryOp:   "Single-operand expression. value = operator (- or !). left = operand.",
  Assign:    "Assignment. value = variable name. left = new value expression.",
  Number:    "Numeric literal. value = the number.",
  StringLiteral: "String literal. value = the text content (with quotes).",
  Ident:     "Variable reference. value = variable name.",
  Call:      "Function call. value = function name. Children = arguments.",
};

const NodeDetail = ({ node }) => {
  if (!node) {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>
          Click any node in the tree to inspect it.
        </p>
      </div>
    );
  }

  const description = descriptionMap[node.type] || DEFAULT_DESCRIPTION;

  return (
    <div className={styles.panel}>
      <h3 className={styles.nodeType}>{node.type}</h3>
      
      <table className={styles.table}>
        <tbody>
          <tr>
            <td>Type</td>
            <td>{node.type || '—'}</td>
          </tr>
          <tr>
            <td>Value</td>
            <td>{node.value || '—'}</td>
          </tr>
          <tr>
            <td>Line</td>
            <td>{node.line || '—'}</td>
          </tr>
          <tr>
            <td>Column</td>
            <td>{node.col || '—'}</td>
          </tr>
          <tr>
            <td>Role</td>
            <td>{node.role || '—'}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.description}>
        {description}
      </div>
    </div>
  );
};

export default NodeDetail;
